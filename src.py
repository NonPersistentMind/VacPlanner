from config import *
from utils import *
import pandas as pd
import os
import re
import datetime as dt
import aiohttp
import typing as t
import logging
import warnings
import sys
import json
import requests as rq
import pandas as pd
from pathlib import Path
from matplotlib import pyplot as plt
from dataschemas import *
plt.style.use('fivethirtyeight')


# Create necessary folders and files
Path.mkdir(RESULTS_FOLDER, exist_ok=True, parents=True)
Path.mkdir(DATA_FOLDER, exist_ok=True, parents=True)
Path.mkdir(SOURCE_FOLDER, exist_ok=True, parents=True)
Path.mkdir(LOGGING_FOLDER, exist_ok=True, parents=True)
Path.touch(warnings_file, exist_ok=True)
Path.touch(logging_file, exist_ok=True)


warn = logging.getLogger("Warnings")
warn.setLevel(LOGGING_LEVEL)
# Configure the file to which the logger will write
file_handler = logging.FileHandler(warnings_file, mode='w')
file_handler.setLevel(LOGGING_LEVEL)
formatter = logging.Formatter('\n%(asctime)s :: %(levelname)s\n%(message)s')
file_handler.setFormatter(formatter)
warn.addHandler(file_handler)


def log_warning(message, category, filename, lineno, file=None, line=None):
    warning = warnings.formatwarning(message, category, filename, lineno, line)
    warn.warn(warning)


warnings.showwarning = log_warning

log = logging.getLogger("Info")
log.propagate = False
log.setLevel(LOGGING_LEVEL)
# Configure the file to which the logger will write
file_handler = logging.StreamHandler(sys.stdout)
file_handler.setLevel(LOGGING_LEVEL)
formatter = logging.Formatter(
    ''.center(100, '–') +
    '\n' +
    '%(asctime)s :: %(levelname)s\n%(message)s\n' +
    ''.center(100, '–') +
    '\n'
)
file_handler.setFormatter(formatter)
log.addHandler(file_handler)
log = log.info

debug = logging.getLogger("Debugger")
debug.propagate = False
debug.setLevel(LOGGING_LEVEL)
# Configure the file to which the logger will write
file_handler = logging.FileHandler(logging_file, mode='w')
file_handler.setLevel(LOGGING_LEVEL)
formatter = logging.Formatter('\n%(asctime)s :: %(levelname)s\n%(message)s')
file_handler.setFormatter(formatter)
debug.addHandler(file_handler)
debug = debug.debug

# For testing purposes
if CHECKUP_REQUIRED:
    CHECKUP_FOLDER = Path('./Results/Checkup')
    Path.mkdir(CHECKUP_FOLDER, exist_ok=True, parents=True)


def get_filename_date(filename: str) -> t.Dict[str, str]:
    """Return the date from the filename in the format "YYYY-MM-DD"

    Args:
        filename (str): Name of the file (usually from the Path.name attribute)

    Raises:
        ValueError: If the filename does not contain a date in the format "YYYY-MM-DD"

    Returns:
        t.Dict[str, str]: dictionary with keys 'year', 'month', 'day' and their respective values
    """
    pattern = r'(\d{4})-(\d{2})-(\d{2})'
    date_match = re.search(pattern, filename)

    if date_match:
        year = date_match.group(1)
        month = date_match.group(2)
        day = date_match.group(3)
        return {'year': year, 'month': month, 'day': day}
    else:
        raise ValueError(
            f'Filename {filename} does not contain a date in the format "YYYY-MM-DD"')


def get_latest_file(DATA_FOLDER: str | Path) -> Path:
    LATEST_FILE = sorted([filename for filename in DATA_FOLDER.iterdir() if filename.stem not in [
                         '.DS_Store', 'Auxillary', 'Historical Data']], key=lambda fn: dt.date.fromisoformat(fn.name[-5 - 10:-5]))[-1]
    return LATEST_FILE


def _assume_report_date(df: pd.DataFrame) -> pd.Timestamp:
    return df['дата оновлення'].max().to_pydatetime()


def _inverse_correction(df: pd.DataFrame, target: str, based_on: str, new_label: str = None, method: str = "popular", verbose: bool = False) -> None:
    # ———————————————————————————— Визначити назву вакцини за серією препарату і переписати назви у вхідних даних ————————————————————————————
    series_df = df.groupby([based_on])[target].apply(lambda entries: [[entry, len(
        entries[entries == entry])] for entry in entries.unique() if not pd.isna(entry)]).reset_index()

    if verbose:
        # Вивести "based_on" без жодного варіанту
        series_df[series_df[target].apply(lambda entries: len(entries)) == 0].to_excel(
            RESULTS_FOLDER / f'{based_on} без {target}.xlsx', index=False)
        # Вивести  "based_on" з багатьма варіантами "target"
        series_df[series_df[target].apply(lambda entries: len(entries)) > 1].to_excel(
            RESULTS_FOLDER / f'{based_on} з багатьма варіантами {target}.xlsx', index=False)

    # Залишити тільки серії, де є хоча б одна назва препарату
    series_df = series_df[~(series_df[target].apply(
        lambda entries: len(entries)) == 0)]

    # Обрати назву препарату, яка найчастіше зустрічається в серії
    overwritings = series_df.apply(lambda row: max(
        row[target], key=lambda pair: pair[1])[0], axis=1)
    series_df[new_label if new_label else ("Нова " + target)] = overwritings

    series_df = series_df[[based_on, new_label if new_label else (
        "Нова " + target)]].set_index(based_on)

    df[target] = df[[based_on, target]].apply(lambda row: series_df.to_dict(
    )[new_label if new_label else ("Нова " + target)].get(row[based_on], row[target]), axis=1)
    # ————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————


def _clean_data(df: pd.DataFrame) -> None:
    df.columns = df.columns.str.strip()
    df.rename(columns={'Серія препарту': 'Серія препарату'}, inplace=True)

    df['Заклад'] = df['Заклад'].str.strip()
    df['Кількість доз'] = df['Кількість доз'].astype(int)
    df['Регіон'] = df['Регіон'].str.replace(' область', '')
    df['Регіон'] = df['Регіон'].str.replace(' обл.', '')
    df['Регіон'] = df['Регіон'].str.replace(' обл', '')
    # ————————————————————————————————————————————————————— Temporary Issuefixing Section —————————————————————————————————————————————————————
    if df['Регіон'].isna().any():
        debug(f"Found NaN values in 'Регіон' column. Skipping them.")
        df = df[df['Регіон'].notna()]

    df = df[df['Регіон'].isin(region_positions.keys())]
    df['Заклад'] = df['Заклад'].fillna('Невідомий заклад')
    df = df[df["Міжнародна непатентована назва"].notna()]
    df['Регіон'] = df['Регіон'].replace(
        'чЕРНІГІВСЬКА ОБЛАСТЬ', 'Чернігівська область')
    df['Джерело фінансування'] = df['Джерело фінансування'].fillna(
        'Невідоме джерело')
    df['Джерело фінансування'] = df['Джерело фінансування'].replace(
        ['Держбюджет', 'Державний бюджет'], 'Державний бюджет (невідомий рік)')
    df['Джерело фінансування'] = df['Джерело фінансування'].replace('120', 'Гуманітарна допомога')
    
    df['Міжнародна непатентована назва'] = df['Міжнародна непатентована назва'].replace({
        '/Вакцина для профілактики сказу ': 'Сказ',
        'Тетанус Гамма': 'Правець',
    })
    # df = df[df['Міжнародна непатентована назва'] != 'Вакцини від COVID-19']
    # df = df[df['Міжнародна непатентована назва'] != 'Pfizer Omicron']
    # ————————————————————————————————————————————————————— Temporary Issuefixing Section —————————————————————————————————————————————————————

    _inverse_correction(df, DS.vacname, DS.vacseries, new_label='Назва препарату')
    if not SPECIFIC_DATASOURCE.startswith('MedData'):
        _inverse_correction(df, 'Заклад', 'код ЄДРПОУ', new_label='Назва закладу')
        _inverse_correction(df, 'код ЄДРПОУ', 'Заклад', new_label='Код ЄДРПОУ')
        _inverse_correction(df, 'Торгівельна назва', 'Серія препарату', new_label='temp')
        _inverse_correction(df, 'Виробник', 'Серія препарату', new_label='temp')
    
    df['Міжнародна непатентована назва'] = df['Міжнародна непатентована назва'].replace(
        vaccine_shorts)
    if SPECIFIC_DATASOURCE != 'MedData' and not set(df['Міжнародна непатентована назва'].unique()) <= set(vaccine_shorts.values()):
        log(f"Found unknown vaccine names: {set(df['Міжнародна непатентована назва'].unique()) - set(vaccine_shorts.values())}")
    df = df[df["Міжнародна непатентована назва"].isin(vaccine_shorts.values())]
    df = df[~df['Міжнародна непатентована назва'].isin(VACCINES_SKIPPED)]

    df[DS.upd_date] = pd.to_datetime(df[DS.upd_date], dayfirst=SPECIFIC_DATASOURCE != 'MedData Routine')
    df[DS.exp_date] = pd.to_datetime(df[DS.exp_date], errors="raise", dayfirst=SPECIFIC_DATASOURCE != 'MedData Routine')

    # Remove any data reporting vaccine with expiration date older than the latest report date
    REPORT_DATE = _assume_report_date(df)
    df.loc[df[DS.upd_date].isna(), DS.upd_date] = REPORT_DATE - dt.timedelta(days=14)
    
    # Remove any records that were updated more than 7 days ago. Save them for further analysis
    timed_outs = df[(REPORT_DATE - df[DS.upd_date]) > dt.timedelta(days=7)]
    df = df[df[DS.exp_date] > REPORT_DATE]
    
    df.loc[:, DS.exp_date] = df[DS.exp_date].dt.date
    
    return df, REPORT_DATE.date(), timed_outs


def _get_meddata(refresh=False) -> pd.DataFrame:
    class DFCols:
        REGION = 'Регіон'
        FACILITY = 'Заклад'
        EDRPOU = 'код ЄДРПОУ'
        VACCINE = 'Міжнародна непатентована назва'
        VACCINE_SERIES = 'Серія препарату'
        EXPIRATION_DATE = 'Термін придатності'
        AMOUNT = 'Кількість доз'
        ACCOUNTING_DATE = 'дата оновлення'
        FUND_SOURCE = 'Джерело фінансування'
        REQUIRED_COLUMNS = [EDRPOU, FACILITY, VACCINE_SERIES,
                            VACCINE, EXPIRATION_DATE, AMOUNT, 
                            ACCOUNTING_DATE, REGION, FUND_SOURCE]

    MEDDATA_FOLDER = DATA_FOLDER / 'MedData'
    FACILITIES_STOCK_FILE = MEDDATA_FOLDER / 'FacilitiesStock.csv'
    # Create necessary folders and files
    Path.mkdir(MEDDATA_FOLDER, exist_ok=True,)

    # Update if the main dataset was downloaded more than 1 week ago
    if refresh or \
        not Path.exists(FACILITIES_STOCK_FILE) or \
        (dt.datetime.now() - dt.datetime.fromtimestamp(Path(FACILITIES_STOCK_FILE).stat().st_mtime)).days >= 7:

        log('Downloading data from MedData.')
        # ––––––––––––––––––––––––––––––––––––––––– Download facility-level stock data –––––––––––––––––––––––––––––––––––––––––
        df = pd.DataFrame()
        for region in [k for k in region_positions.keys() if k not in ['НацСклади', 'Україна']]:
            region = region.replace('м. ', '').upper()
            message = f'{region}. '
            try:
                rp = rq.get(f'https://vaccine.meddata.com.ua/index.php?\
                    option=com_fabrik&task=meddata.safemed&method=getList&format=raw&\
                        region={region}&\
                        from_date={dt.datetime.now().date() - dt.timedelta(days=200)}')
                df = pd.concat(
                    [df, pd.DataFrame(rp.json()['data'])], ignore_index=True, axis=0)
                log(message + 'Successfully processed.')
            except json.JSONDecodeError as e:
                log(message + f'Error has happened. {e}')
        df.to_csv(FACILITIES_STOCK_FILE, index=False, sep=';')
        # –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    else:
        log('Picking existing MedData data.')
    
    # Get facilities that are located in Kyiv City
    rp = rq.get('https://vaccine.meddata.com.ua/index.php?option=com_fabrik&task=meddata.safemed&method=get_edrpou_kyiv&format=raw')
    kyiv_facilities = pd.DataFrame(rp.json()['data'])
    kyiv_facilities['edrpou'] = kyiv_facilities['edrpou'].astype(str)

    # –––––––––––––––––––––––––––––––––––––––––––– Download regional stock data ––––––––––––––––––––––––––––––––––––––––––––
    rp = rq.get('https://vaccine.meddata.com.ua/index.php?\
        option=com_fabrik&task=meddata.safemed&\
            method=vaccines_regional&format=raw')
    regional_stock = pd.DataFrame(rp.json()['data'])
    regional_stock.to_csv(DATA_FOLDER / 'MedData' /
                          'RegionalStock.csv', index=False, sep=';')

    regional_stock = pd.read_csv(
        DATA_FOLDER / 'MedData' / 'RegionalStock.csv', sep=';')
    regional_stock.drop(columns=['manufacture_date'], inplace=True)
    regional_stock.rename(
        columns={
            'zaklad': 'name',
            'vaccine_name': 'trade_name',
            'supply_date': 'accounting_date',
            'defrosting_date': 'expire_date_defrosting',
        },
        inplace=True)

    regional_stock.loc[regional_stock['edrpou'] == 38502841,
                       'name'] = 'ДЕРЖАВНА УСТАНОВА "ПОЛТАВСЬКИЙ ОБЛАСНИЙ ЦЕНТР КОНТРОЛЮ ТА ПРОФІЛАКТИКИ ХВОРОБ МІНІСТЕРСТВА ОХОРОНИ ЗДОРОВ\'Я УКРАЇНИ"'
    regional_stock['accounting_date'] = pd.to_datetime(
        regional_stock['accounting_date'])
    regional_stock['expire_date'] = pd.to_datetime(
        regional_stock['expire_date'])
    regional_stock['expire_date_defrosting'] = pd.to_datetime(
        regional_stock['expire_date_defrosting'])
    regional_stock['region_order'] = regional_stock['name'].str.extract(
        r'(?i)(\w+-?\w+(?:с|ц|з)ький)')[0].str.replace('(?i)ий$', 'а', regex=True).str.title()
    debug(f"N/A values in 'accounting_date' column: {regional_stock['accounting_date'].isna().sum()}")
    regional_stock['accounting_date'] = regional_stock['accounting_date'].fillna(dt.datetime.now())
    regional_stock['expire_date_defrosting'] = regional_stock['accounting_date'] + dt.timedelta(days=7*10)
    # –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

    # –––––––––––––––––––––––––––––––––––––––––––––––– Data processing begins –––––––––––––––––––––––––––––––––––––––––––––––
    df = pd.read_csv(FACILITIES_STOCK_FILE, sep=';')
    
    df['region_order'] = df['region_order'].str.title()
    df['edrpou'] = df['edrpou'].astype(str)
    df['accounting_date'] = pd.to_datetime(df['accounting_date'], errors='coerce')
    df['expire_date'] = pd.to_datetime(df['expire_date'], errors='coerce')
    df['expire_date_defrosting'] = pd.to_datetime(df['expire_date_defrosting'], errors='coerce')
    
    df.loc[df['edrpou'].isin(kyiv_facilities['edrpou']), 'region_order'] = 'м. Київ'
    
    # Potential loss of data
    debug(f"Removing NaN values from 'expire_date' and 'expire_date_defrosting' columns. Current shape: {df.shape}")
    df = df.dropna(subset=['expire_date', 'expire_date_defrosting'], how='all')
    debug(f"Shape after removing NaN values: {df.shape}")
    
    # Potential loss of data
    debug(f"Removing NaN values from 'accounting_date' column. Current shape: {df.shape}")
    df.dropna(subset=['accounting_date'], inplace=True)
    debug(f"Shape after removing NaN values: {df.shape}")

    # Add regional stock data to facility-level data
    df = pd.concat([df, regional_stock], ignore_index=True, axis=0)

    # Replace expire_date with expire_date_defrosting if the latter exists and is less than the former
    expire_date_replacement = (df['expire_date_defrosting'].notna()) & (
        df['expire_date_defrosting'] < df['expire_date'])
    df.loc[
        expire_date_replacement,
        'expire_date'
    ] = df.loc[expire_date_replacement, 'expire_date_defrosting']
    df = df.drop(columns=['expire_date_defrosting'])
    
    # Replace long vaccine names with short ones
    df['trade_name'] = df['trade_name'].str.replace(r'(?i)\w*Comirnaty.*\(child\)\w*', 'Pfizer (дитячий)', regex=True)
    df['trade_name'] = df['trade_name'].str.replace(r'(?i).*(?:Comirnaty|Pfizer)(?! \(дитяч\w+\)).*', 'Pfizer', regex=True)
    df.loc[df['series']=='HL8354', 'trade_name'] = 'Pfizer (дитячий)'
    
    df = df[df['series'].isin(['GA2988', 'GK0925', 'HJ3099','GC9425', 'HL8354'])]  # Specific series

    # Compute the amount of consumed vaccines for the last "pure" 6 months
    month_period = 7 # Last 6 months
    now = dt.datetime.now()
    start_date = dt.datetime(
        now.year + (now.month - month_period) // 12,
        (now.month - month_period) % 12 + 1,
        1
    )
    end_date = dt.datetime(now.year, now.month, 1) - dt.timedelta(days=1)

    usage = df[
        df['accounting_date'].between(start_date, end_date)
    ].groupby([df['accounting_date'].dt.to_period('M'), 'region_order', 'trade_name'])[
        ['cons_quantity', 'broken']
    ].sum()
    usage.reset_index(inplace=True)
    usage['accounting_date'] = usage['accounting_date'].dt.to_timestamp()
    usage['total_usage'] = usage['cons_quantity'] + usage['broken']
    usage.rename(
        columns={
            'accounting_date': 'Дата',
            'region_order': "Регіон",
            'trade_name': "Міжнародна непатентована назва",
            'cons_quantity': "Кількість  зроблених  у звітному місяці щеплень",
            'total_usage': "Використано доз за звітний місяць при проведенні щеплень",
        },
        inplace=True
    )
    usage.drop(columns=['broken'], inplace=True)
    usage.to_csv(DATA_FOLDER / 'MedData' / 'Usage.csv', sep=';', index=False)

    df = df.groupby([
        'region_order',
        'name',
        'edrpou',
        'trade_name',
        'series',
        'expire_date'
    ]).apply(lambda xs: xs[xs['accounting_date'] == xs['accounting_date'].max()][[
        'cons_quantity',
        'broken',
        'balance_quantity',
        'accounting_date',
    ]].iloc[0], include_groups=False)

    df.reset_index(inplace=True)
    
    df = df[df['balance_quantity'] > 0]
    
    if 'Джерело фінансування' not in df.columns:
        df['Джерело фінансування'] = 'Covax'
    else:
        df['Джерело фінансування'] = df['Джерело фінансування'].fillna('Covax')

    df.rename(
        columns={
            'region_order': DFCols.REGION,
            'name': DFCols.FACILITY,
            'edrpou': DFCols.EDRPOU,
            'trade_name': DFCols.VACCINE,
            'series': DFCols.VACCINE_SERIES,
            'expire_date': DFCols.EXPIRATION_DATE,
            'balance_quantity': DFCols.AMOUNT,
            'accounting_date': DFCols.ACCOUNTING_DATE
        }, 
        inplace=True
    )
    df = df[DFCols.REQUIRED_COLUMNS]

    return df


def get_data(
    national_stock_filepath: Path = DATA_FOLDER/'Auxillary'/'Залишки нацрівня.xlsx',
    autosave: bool = True,
    refresh=False
) -> t.Tuple[pd.DataFrame, dt.date, pd.DataFrame, pd.DataFrame]:
    URL = False
    FROM_MEDDATA = SPECIFIC_DATASOURCE == 'MedData'

    if SPECIFIC_DATASOURCE:
        filepath = SPECIFIC_DATASOURCE
        filename = filepath
    else:
        filepath = get_latest_file(DATA_FOLDER)
        filename = filepath.name

    log(f"Starting to process {filename[:40] + (len(filename) > 40 and '...' or '')}")

    filedate = dt.date.today()
    filedate = {'year': filedate.year,
                'month': filedate.month, 
                'day': filedate.day}
    # If filepath is a valid http[s] url, process it as URL
    if filename.startswith('http://') or filename.startswith('https://'):
        URL = True
        filepath = filepath.replace('/edit#gid=', '/export?format=csv&gid=')
    elif not SPECIFIC_DATASOURCE:
        filedate = get_filename_date(filepath.stem)

    national_leftovers_df = get_national_leftovers(national_stock_filepath)

    savepath = DATA_FOLDER / 'Historical Data' / \
        f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}.pkl'
    if refresh or not Path.exists(savepath):
        df = _get_meddata(refresh=refresh) if FROM_MEDDATA else \
            pd.read_csv(filepath) if URL else \
            pd.read_excel(
            filepath,
            sheet_name='Залишки поточні',
            dtype={' код ЄДРПОУ': str},
            engine='openpyxl'
        )
        df, REPORT_DATE, timed_outs = _clean_data(df)

        df = pd.concat([df, national_leftovers_df[national_leftovers_df['Дата поставки'].isna()][[
                       'Міжнародна непатентована назва',
                       'Регіон',
                       'Термін придатності',
                       'Кількість доз',
                       'Джерело фінансування'
                       ]]], ignore_index=True)

        if autosave:
            # Save preprocessed data
            Path.mkdir(DATA_FOLDER / 'Historical Data',
                       exist_ok=True, parents=True)
            df.to_pickle(savepath)
            timed_outs.to_pickle(DATA_FOLDER / 'Historical Data' /
                                 f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}_timed_outs.pkl')
    else:
        df = pd.read_pickle(savepath)
        timed_outs = pd.read_pickle(DATA_FOLDER / 'Historical Data' /
                                    f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}_timed_outs.pkl')
        REPORT_DATE = _assume_report_date(df).date()

    log(f"Data loaded. {REPORT_DATE} is the file's report date.")
    return df, REPORT_DATE, timed_outs, national_leftovers_df


async def get_meddata(mode: t.Literal["routine", "covid"]) -> pd.DataFrame:
    if mode == "routine":
        URL = "https://vaccination.meddata.com.ua/index.php?option=com_fabrik\
               &task=meddata.api&method=get_balance_by_regions&format=raw"
    elif mode == "covid":
        raise NotImplementedError("Covid data is not available yet")
    else:
        raise ValueError("Mode should be either 'routine' or 'covid'")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(URL) as response:
            if response.status == 200 and response.content_type == 'application/json':
                data = await response.json()
            else:
                log(f"Error: Received response with status {response.status} and content type {response.content_type}")
    
    df = pd.DataFrame(data["data"]["vaccines"])
    
    df = df.rename(columns={
        'short_name': DS.vacname,
        'region': DS.region,
        'zoz_name': DS.facility,
        'edrpou': DS.edrpou,
        'series': DS.vacseries,
        'expire_date': DS.exp_date,
        'expire_date_defrosting': DS.defrost_exp_date,
        'accounting_date': DS.upd_date,
        'balance_quantity': DS.doses,
        'quarantine_amount': DS.quarantined_doses,
        'utilization_amount': DS.utilized_doses,
        'manufacturer': DS.manufacturer,
        'source': DS.fundsource,
        'latitude': DS.latitude,
        'longitude': DS.longitude,
    })
    
    return df
    


async def get_data_v2(
        refresh: bool = False,
        autosave: bool = True,
        national_stock_filepath: Path = DATA_FOLDER/'Auxiliary'/'Залишки нацрівня.xlsx',
    ) -> tuple[pd.DataFrame, dt.date, pd.DataFrame, pd.DataFrame]:    
    # Ensure updates on specific dates
    filedate = dt.date.today()
    if filedate.day < 6:
        filedate = dt.date(filedate.year, filedate.month - 1, 21)
    elif filedate.day < 21:
        filedate = dt.date(filedate.year, filedate.month, 6)
    else:
        filedate = dt.date(filedate.year, filedate.month, 21)
    
    log(f"Starting to process {filedate}")
    
    history_dir = HISTORICAL_DATA_FOLDER / f'{filedate.year}-{filedate.month:02d}-{filedate.day:02d}'
    if not refresh and Path.exists(history_dir):
        df = pd.read_parquet(history_dir / 'rawdata.parquet.gzip')
        timed_outs = pd.read_parquet(history_dir / 'timedouts.parquet.gzip')
        national_stock = pd.read_parquet(history_dir / 'national_stock.parquet.gzip')
        REPORT_DATE = _assume_report_date(df).date()
        
        log(f"Found cached data. {REPORT_DATE} is the file's report date.")
        return df, REPORT_DATE, timed_outs, national_stock

    log(f"{filedate=} not found in cache. Fetching data...")
    
    match SPECIFIC_DATASOURCE:
        case None:
            filepath = get_latest_file(DATA_FOLDER)
            filedate = get_filename_date(filepath.stem)
            async def fetch_data():
                return pd.read_excel(
                    filepath,
                    sheet_name='Залишки поточні',
                    dtype={' код ЄДРПОУ': str},
                    engine='openpyxl'
                )
        case str(filepath) if (SPECIFIC_DATASOURCE.startswith('http') and ("/edit#gid=" in SPECIFIC_DATASOURCE)):
            filepath = filepath.replace('/edit#gid=', '/export?format=csv&gid=')
            async def fetch_data():
                return pd.read_csv(filepath)
        case "MedData Routine":
            async def fetch_data():
                return await get_meddata(mode="routine")
        case "MedData Covid":
            async def fetch_data():
                return await get_meddata(mode="covid")
    
    df = await fetch_data()
    log(f"Data fetched. Cleaning and processing...")
    df, REPORT_DATE, timed_outs = _clean_data(df)
    log(f"Data cleaned. {REPORT_DATE} is the file's report date.")
    
    legacy_national_stock = get_national_leftovers(national_stock_filepath, refresh=refresh)
    
    if SPECIFIC_DATASOURCE != "MedData Routine":
        national_stock = legacy_national_stock
        df = pd.concat(
            [df, national_stock[national_stock['Дата поставки'].isna()][[
                DS.vacname, DS.region, DS.exp_date, 
                DS.doses, DS.fundsource
            ]]],
            ignore_index=True
        )
    else:
        national_stock = legacy_national_stock
        # national_stock = df[df[DS.facility].str.contains("ЦКПХ")]
        # national_stock = pd.concat(
        #     [national_stock, legacy_national_stock[legacy_national_stock["Дата поставки"].notna()]],
        #     ignore_index=True
        # )

    log(f"Saving data...")
    if autosave:
        Path.mkdir(DATA_FOLDER / 'Historical Data', exist_ok=True, parents=True)
        Path.mkdir(history_dir, exist_ok=True, parents=True)
        
        df.to_parquet(history_dir / 'rawdata.parquet.gzip', compression='gzip')
        timed_outs.to_parquet(history_dir / 'timedouts.parquet.gzip', compression='gzip')
        national_stock.to_parquet(history_dir / 'national_stock.parquet.gzip', compression='gzip')
    
    log(f"Data saved. Retrieval complete.")
    return df, REPORT_DATE, timed_outs, national_stock


def _get_national_stock_meddata() -> pd.DataFrame:
    rp = rq.get('https://vaccine.meddata.com.ua/index.php?option=com_fabrik&task=meddata.safemed&method=vaccines_national&format=raw')
    nat_stock = pd.DataFrame(rp.json()['data'])
    nat_stock.rename(columns={
        'vaccine_name': 'Вакцина',
        'balance_quantity': 'Залишок',
        'expire_date': 'Термін придатності'
    }, inplace=True)
    nat_stock['Коментар'] = "ФС"
    nat_stock['Джерело фінансування'] = "Covax"
    nat_stock['Регіон'] = "Нац Рівень"
    nat_stock = nat_stock[[n for n in [
        'Вакцина', 'Регіон', 'Термін придатності', 
        'Залишок','Коментар', 'Джерело фінансування', 
        'Дата поставки', 'Відповідальний за імпорт'] if n in nat_stock.columns]]
    if 'Дата поставки' not in nat_stock.columns:
        nat_stock['Дата поставки'] = pd.NA
    if 'Відповідальний за імпорт' not in nat_stock.columns:
        nat_stock['Відповідальний за імпорт'] = pd.NA
    
    nat_stock['Термін придатності'] = pd.to_datetime(nat_stock['Термін придатності'])

    # Replace child comirnaty with 'Pfizer (дитяча)'
    nat_stock['Вакцина'] = nat_stock['Вакцина'].str.replace(r'(?i)\w*Comirnaty.*\(child\)\w*', 'Pfizer (дитячий)', regex=True)
    # Replace comirnaty and pfizer with 'Pfizer'
    nat_stock['Вакцина'] = nat_stock['Вакцина'].str.replace(r'(?i).*(?:Comirnaty|Pfizer)(?! \(дитячий\)).*', 'Pfizer', regex=True)
    return nat_stock


# def get_national_leftovers(
#         filepath: Path = DATA_FOLDER/'Auxillary'/'Залишки нацрівня.xlsx', 
#         custom_processor: t.Callable[(...), pd.DataFrame] | None = None,
#         refresh: bool = False
#     ) -> pd.DataFrame:
#     # Find the date of the most recent monday (the day the data is usually updated)
#     today = dt.date.today()
#     recent_monday = today - dt.timedelta(days=today.weekday())
#     URL = False
#     FROM_MEDDATA = SPECIFIC_NATIONAL_STOCK_FILE == 'MedData'
    
#     # Check if the specific source is a URL
#     if SPECIFIC_NATIONAL_STOCK_FILE.startswith('http://') or SPECIFIC_NATIONAL_STOCK_FILE.startswith('https://'):
#         URL = SPECIFIC_NATIONAL_STOCK_FILE.replace(
#             '/edit#gid=', '/export?format=csv&gid=')
#     if not Path.exists(DATA_FOLDER / f"/Auxillary/Залишки нацрівня {recent_monday}.pkl"):
#         if URL:
#             log(f"Reading national leftovers from {URL}")
#             national_leftovers_df = pd.read_csv(URL)
#         elif FROM_MEDDATA:
#             log(f"Reading national leftovers from MedData")
#             national_leftovers_df = _get_national_stock_meddata()
#         else:
#             log(f"Reading national leftovers from {filepath}")
#             national_leftovers_df = pd.read_excel(
#                 filepath, sheet_name='Залишки і поставки')
            
#         national_leftovers_df = national_leftovers_df.rename(
#             columns={'Вакцина': 'Міжнародна непатентована назва', 'Залишок': 'Кількість доз'})
#         national_leftovers_df['Міжнародна непатентована назва'] = national_leftovers_df['Міжнародна непатентована назва'].replace(
#             'Хіб', 'ХІБ')
#         national_leftovers_df['Регіон'] = 'Україна'
#         national_leftovers_df['Термін придатності'] = pd.to_datetime(
#             national_leftovers_df['Термін придатності'], format="%d.%m.%Y").dt.date
#         national_leftovers_df['Дата поставки'] = pd.to_datetime(
#             national_leftovers_df['Дата поставки'], format="%d.%m.%Y").dt.date

#         national_leftovers_df.to_pickle(
#             DATA_FOLDER / f"Auxillary/Залишки нацрівня {recent_monday}.pkl")
#     else:
#         debug(
#             f"Reading national leftovers from {DATA_FOLDER}/Auxillary/Залишки нацрівня {recent_monday}.pkl")
#         national_leftovers_df = pd.read_pickle(
#             f"{DATA_FOLDER}/Auxillary/Залишки нацрівня {recent_monday}.pkl")
#     return national_leftovers_df


def get_national_leftovers(
    filepath: Path = DATA_FOLDER/'Auxiliary'/'Залишки нацрівня.xlsx', 
    custom_processor: t.Callable[(...), pd.DataFrame] | None = None,
    refresh: bool = False
) -> pd.DataFrame:
    URL = None
    HISTORICAL_NATIONAL_STOCK_FOLDER = DATA_FOLDER / "Historical Data"
    # Find the date of the most recent monday (the day the data is usually updated)
    today = dt.date.today()
    recent_monday = today - dt.timedelta(days=today.weekday())

    # Check if the specific source is a URL
    if SPECIFIC_NATIONAL_STOCK_FILE.startswith('http://') or SPECIFIC_NATIONAL_STOCK_FILE.startswith('https://'):
        URL = SPECIFIC_NATIONAL_STOCK_FILE.replace('/edit#gid=', '/export?format=csv&gid=')


    if refresh or not Path.exists(HISTORICAL_NATIONAL_STOCK_FOLDER / f"Залишки нацрівня {recent_monday}.pkl"):
        if URL:
            debug(f"Reading national leftovers from {URL}")
            national_leftovers_df = pd.read_csv(URL)
        else:
            debug(f"Reading national leftovers from {filepath}")
            national_leftovers_df = pd.read_excel(filepath, sheet_name='Залишки і поставки')
                    
        national_leftovers_df = national_leftovers_df.rename(columns={'Вакцина': DS.vacname, 'Залишок': DS.doses})
        national_leftovers_df[DS.vacname] = national_leftovers_df[DS.vacname].replace('Хіб', 'ХІБ')
        national_leftovers_df[DS.region] = 'Україна'
        national_leftovers_df[DS.exp_date] = pd.to_datetime(national_leftovers_df[DS.exp_date], format="%d.%m.%Y").dt.date 
        national_leftovers_df['Дата поставки'] = pd.to_datetime(national_leftovers_df['Дата поставки'], format="%d.%m.%Y").dt.date 
        
        national_leftovers_df.to_pickle(HISTORICAL_NATIONAL_STOCK_FOLDER / f"{recent_monday}.pkl")
    else:
        debug(f'Reading national leftovers from {HISTORICAL_NATIONAL_STOCK_FOLDER / f"Залишки нацрівня {recent_monday}.pkl"}')
        national_leftovers_df = pd.read_pickle(HISTORICAL_NATIONAL_STOCK_FOLDER / f"Залишки нацрівня {recent_monday}.pkl")
        
    return national_leftovers_df[
        (national_leftovers_df["Дата поставки"].isna()) | 
        (national_leftovers_df["Дата поставки"] >= dt.date.today())
    ]


def get_nationalStock_with_storage():
    national_stock = get_national_leftovers()
    national_stock = national_stock[national_stock['Дата поставки'].isna()]
    national_stock = national_stock.rename(
        columns={'Коментар': 'Місце зберігання'})
    return national_stock[[
        'Міжнародна непатентована назва',
        'Регіон',
        'Кількість доз',
        'Місце зберігання',
        'Джерело фінансування'
    ]].groupby([
        'Міжнародна непатентована назва',
        'Регіон',
        'Джерело фінансування',
        'Місце зберігання'
    ])[[
        'Кількість доз',
    ]].agg({
        'Кількість доз': 'sum',
    }).reset_index()


def compute_future_supplies(national_leftovers_df: pd.DataFrame) -> pd.DataFrame:
    future_supplies_data = national_leftovers_df[national_leftovers_df['Дата поставки'].notna()]
    future_supplies_data["Міжнародна непатентована назва"] = future_supplies_data["Міжнародна непатентована назва"].ffill()
    future_supplies_data["Дата поставки"] = pd.to_datetime(future_supplies_data["Дата поставки"], format="%d.%m.%Y")
    if SKIP_FUTURE_SUPPLIES:
        future_supplies_data.loc[:, 'Кількість доз'] = 0

    if TESTING:
        assert future_supplies_data['Дата поставки'].notna().all(
        ), "Не для всіх майбутніх поставок вакцин вказана дата поставки"

    return future_supplies_data


def compute_future_supplies_export(future_supplies_data: pd.DataFrame, extended=False) -> t.Dict[str, t.Dict[str, int]]:
    temporary_df = future_supplies_data.copy()

    temporary_df['Дата поставки'] = temporary_df['Дата поставки'].apply(
        lambda x: x.strftime('%Y-%m-%d'))
    future_supplies_export = {}

    for vaccine, supplies in temporary_df.groupby('Міжнародна непатентована назва'):
        if extended:
            res = supplies.groupby('Дата поставки')[['Кількість доз', 'Відповідальний за імпорт']].aggregate(
                {'Кількість доз': 'sum', 'Відповідальний за імпорт': lambda x: ', '.join(x.unique())}).to_dict(orient='index')
        else:
            res = supplies.groupby('Дата поставки')[
                'Кількість доз'].sum().to_dict()
        future_supplies_export[vaccine] = res

    return future_supplies_export


def compute_timed_outs_report(timed_outs: pd.DataFrame) -> pd.DataFrame:
    return timed_outs.groupby('Регіон')[['Кількість доз', 'Заклад']].apply(lambda group: [group['Кількість доз'].sum(), group['Заклад'].unique()]).sort_values(by="Кількість доз", ascending=False)


def compute_region_with_foundsource_df(df: pd.DataFrame) -> pd.DataFrame:
    return df.groupby(['Регіон', "Міжнародна непатентована назва", 'Джерело фінансування'])['Кількість доз'].sum().reset_index()


def compute_region_df(df: pd.DataFrame, REPORT_DATE: dt.date, autosave: bool = True) -> pd.DataFrame:
    region_df = df.groupby(["Регіон", "Міжнародна непатентована назва"])[
        ['Кількість доз']].sum().reset_index()
    region_df = region_df.pivot_table(values='Кількість доз', columns='Регіон',
                                      index='Міжнародна непатентована назва').fillna(0).astype(int).T
    region_df.sort_index(key=lambda index: pd.Index(
        region_positions[x] for x in index), inplace=True)

    if CHECKUP_REQUIRED and autosave:
        region_df.to_excel(
            CHECKUP_FOLDER / f'Залишки по регіонах на {REPORT_DATE}.xlsx')

    return region_df


def compute_vaccines_left_sorted(region_df: pd.DataFrame) -> pd.DataFrame:
    vaccines_left_sorted = region_df.sum(
        axis=0).sort_values(ascending=False).to_frame()
    return vaccines_left_sorted


def compute_institutional_data(df: pd.DataFrame) -> pd.DataFrame:
    institutional_level_data_df = df.groupby(['Регіон', 'Заклад', 'Міжнародна непатентована назва'], dropna=False)[
        ['Кількість доз']].sum().reset_index()
    institutional_level_data_df.replace('Україна', 'НацСклади', inplace=True)

    institutional_level_data_df['Заклад'] = institutional_level_data_df['Заклад'].fillna(
        'Невідомий заклад')
    institutional_level_data_df['Міжнародна непатентована назва'] = institutional_level_data_df['Міжнародна непатентована назва'].fillna(
        'Невідома вакцина')
    institutional_level_data_df.rename(columns={
                                       'Заклад': 'Fclt', 'Міжнародна непатентована назва': 'Name', 'Кількість доз': 'Amnt', 'Регіон': 'Rgn'}, inplace=True)

    return institutional_level_data_df


def compute_expiration_timelines(
    df: pd.DataFrame,
    national_leftovers_df: pd.DataFrame,
    SUPPLY_SUFFIX: str = " (поставки)",
    specific_regions: t.List[str] | None = None,
    include_future_supplies: bool = True
) -> t.Tuple[t.Dict[str, pd.DataFrame], pd.Series]:
    """
    For each region and each vaccine in it, build a dataframe with timeline, showing how many doses terminate on the given day.
    Only dates with at least one dose termination are included in the timeline.

    Args:
        df (pd.DataFrame): Main dataframe with the data

    Returns:
        t.Dict[str, pd.DataFrame]: {Region: pd.DataFrame(index has datepoints, columns are vaccines, values are doses expired on the given day)}
    """
    expiration_timelines = {}

    if specific_regions:
        assert (set(specific_regions) - {'Україна'}).issubset(
            set(df['Регіон'].unique())), "Specific regions should be a subset of all regions"
    for region, region_data in df.groupby('Регіон'):
        if specific_regions and region not in specific_regions:
            continue
        regional_expirations = pd.DataFrame()
        for vaccine, vaccine_data in region_data.groupby('Міжнародна непатентована назва'):
            vaccine_data = vaccine_data.groupby('Термін придатності')[
                ['Кількість доз']].sum()

            vaccine_data.rename(
                columns={'Кількість доз': vaccine}, inplace=True)
            regional_expirations = pd.concat(
                [regional_expirations, vaccine_data], axis=1)

            regional_expirations.fillna(0, inplace=True)
            regional_expirations.sort_index(inplace=True)

        expiration_timelines[region] = regional_expirations

    # Separately for Ukraine as a whole
    regional_expirations = pd.DataFrame()
    for vaccine, vaccine_data in df.groupby('Міжнародна непатентована назва'):
        vaccine_data = vaccine_data.groupby('Термін придатності')[['Кількість доз']].sum()

        vaccine_data.rename(columns={'Кількість доз': vaccine}, inplace=True)
        regional_expirations = pd.concat(
            [regional_expirations, vaccine_data], axis=1)

    # Add future supplies to the Ukrainian expiration timelines
    future_supplies_data = compute_future_supplies(national_leftovers_df)
    if not include_future_supplies:
        future_supplies_data['Кількість доз'] = 0

    for index, data in future_supplies_data.groupby(['Дата поставки', 'Міжнародна непатентована назва', ]):
        if index[1] not in regional_expirations.columns:
            continue
        # Add future supplies as a separate column in the expiration timelines
        regional_expirations.loc[index[0], index[1] +
                                 SUPPLY_SUFFIX] = data['Кількість доз'].sum()

        data["Термін придатності"] = pd.to_datetime(data["Термін придатності"], format="%d.%m.%Y")
        for expiration_date, doses in data.groupby('Термін придатності', dropna=False)['Кількість доз']:
            if pd.isna(expiration_date):
                expiration_date = index[0] + DEFAULT_SHELF_LIFE

            if expiration_date not in regional_expirations.index:
                regional_expirations.loc[expiration_date] = 0

            regional_expirations.loc[expiration_date, index[1]] += doses.sum()

    PICK_SUPPLIES_MASK = regional_expirations.columns.map(
        lambda x: x.endswith(SUPPLY_SUFFIX))

    regional_expirations.fillna(0, inplace=True)
    regional_expirations.index = pd.to_datetime(regional_expirations.index)
    regional_expirations.sort_index(inplace=True)

    expiration_timelines["Україна"] = regional_expirations

    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Псування за терміном придатності',
                   exist_ok=True, parents=True)
        for region in expiration_timelines:
            expiration_timelines[region].to_excel(
                CHECKUP_FOLDER/'Псування за терміном придатності' / f'{region}.xlsx')

    if TESTING:
        for region in expiration_timelines:
            if region == 'Україна':
                continue
            for vaccine in df[df['Регіон'] == region]['Міжнародна непатентована назва'].unique():
                test_frame = df[(df['Регіон'] == region)
                                & (df['Міжнародна непатентована назва'] == vaccine)
                                ].groupby(["Термін придатності", ])["Кількість доз"].sum()

                assert (expiration_timelines[region][vaccine][expiration_timelines[region][vaccine] != 0] == test_frame).all(
                ), f"Expiration timelines for {region} and {vaccine} do not match"

    return expiration_timelines, PICK_SUPPLIES_MASK


def compute_waning_expiration_based_timelines(
    df: pd.DataFrame,
    expiration_timelines: pd.DataFrame,
    REPORT_DATE: dt.date,
    PICK_SUPPLIES_MASK: pd.Index,
    SUPPLY_SUFFIX: str = " (поставки)",
    specific_regions: t.List[str] | None = None,
    include_future_supplies: bool = True
) -> t.Dict[str, pd.DataFrame]:
    """For each region and each vaccine in it, build a dataframe with timeline of doses left based on expiration dates.
    The timeline will be displayed on the x axis, the number of doses on the y axis.

    Args:
        df (pd.DataFrame): Main dataframe with the data
        expiration_timelines (pd.DataFrame): Dataframe with indexes as dates, columns as vaccines and values as doses expired on the given day
        REPORT_DATE (dt.date): Date of the report
        PICK_SUPPLIES_MASK (pd.Index): Index of columns in the expiration_timelines dataframe that correspond to future supplies (0s for actual expiration dates and 1s for future supplies)
        SUPPLY_SUFFIX (str, optional): Suffix that defines the column as one containing information about future supplies. Defaults to " (поставки)".

    Returns:
        t.Dict[str, pd.DataFrame]: {Region: pd.DataFrame(index has datepoints, columns are vaccines, values are doses available on the given day based on expiration dates only)}
    """
    waning_expiration_based_timelines = {}

    if specific_regions:
        assert set(specific_regions).issubset(set(expiration_timelines.keys())
                                              ), "Specific regions should be a subset of all regions"
    for region in (specific_regions if specific_regions else expiration_timelines):
        vaccine_stock_in_region = (df if region == "Україна" else df[df['Регіон'] == region]).groupby(
            'Міжнародна непатентована назва')['Кількість доз'].sum()
        vaccine_stock_in_region.name = REPORT_DATE

        region_data = expiration_timelines[region].cumsum(axis=0)
        if region == 'Україна' and include_future_supplies:
            region_data = (vaccine_stock_in_region - region_data.loc[:, ~PICK_SUPPLIES_MASK]).add(
                region_data.loc[:, PICK_SUPPLIES_MASK].rename(columns=lambda x: x[:-len(SUPPLY_SUFFIX)]), fill_value=0)
        else:
            region_data = vaccine_stock_in_region - region_data

        region_data = pd.concat(
            [vaccine_stock_in_region.to_frame().T, region_data], axis=0)

        region_data.index = pd.to_datetime(region_data.index)

        region_data = region_data.reindex(region_data.index.append(
            region_data.resample('W').asfreq().index).drop_duplicates().sort_values()).ffill()

        region_data.index = region_data.index.date

        waning_expiration_based_timelines[region] = region_data

    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Залишки, базуючись лише на терміні придатності',
                   exist_ok=True, parents=True)
        for region in waning_expiration_based_timelines:
            waning_expiration_based_timelines[region].to_excel(
                CHECKUP_FOLDER / 'Залишки, базуючись лише на терміні придатності'/f'{region}.xlsx')

    return waning_expiration_based_timelines


def _get_usage_meddata() -> pd.DataFrame:
    usage = pd.read_csv(DATA_FOLDER / 'MedData' / 'Usage.csv', sep=';')
    return usage


def get_usage(filepath: Path = DATA_FOLDER / "Auxillary" / "Використання.csv") -> pd.DataFrame:
    # usages = pd.read_csv(filepath)
    log(f"Starting to prepare usage data.")
    if SPECIFIC_DATASOURCE == 'MedData':
        usages = _get_usage_meddata()
    else:
        usages = pd.read_excel(
            DATA_FOLDER / "Auxillary" / "ЗАЛИШКИ ТА АНАЛІЗ.xlsx",
            engine='openpyxl', sheet_name='Використання'
        )
        # URL = "https://docs.google.com/spreadsheets/d/1qZOq42-xh8l5kAR4_afltyG0gPif600S/edit?gid=185542289#gid=185542289"
        # URL = URL.replace('/edit#gid=', '/export?format=csv&gid=')
        # usages = pd.read_csv(URL)

    usages['Дата'] = pd.to_datetime(usages['Дата'])
    usages['Міжнародна непатентована назва'] = usages['Міжнародна непатентована назва'].replace(
        vaccine_shorts)
    usages['Регіон'] = usages['Регіон'].replace("Київ", "м. Київ")
    return usages


def compute_pivot_usage(usages: pd.DataFrame, vaccines_tracked: t.Iterable) -> pd.DataFrame:
    pivot_usage = usages.pivot_table(index=['Дата', "Регіон"], columns='Міжнародна непатентована назва',
                                     values='Використано доз за звітний місяць при проведенні щеплень', aggfunc='sum')
    pivot_usage.columns.name = None
    pivot_usage = pivot_usage[[
        x for x in pivot_usage.columns if x in vaccines_tracked]]

    if CHECKUP_REQUIRED:
        pivot_usage.to_excel(CHECKUP_FOLDER / 'Використання.xlsx')

    return pivot_usage


def compute_date_based_pivot_usage(pivot_usage: pd.DataFrame, REPORT_DATE: dt.date) -> t.Dict[str, pd.DataFrame]:
    date_based_pivot_usage = {}

    # For each region, create a dictionary with regions as keys mapping to dates and finally to usages for each vaccine on that date and in that region
    for region in pivot_usage.index.levels[1]:
        date_based_pivot_usage[region] = {}
        for date, regional_data in pivot_usage.xs(region, level=1, axis=0).groupby('Дата'):
            if REPORT_DATE - date.date() > dt.timedelta(days=366 + 28):
                continue
            date = date.date().isoformat()
            date_based_pivot_usage[region][date] = regional_data.iloc[0].to_dict(
            )

    # Add Ukraine as well
    date_based_pivot_usage['Україна'] = {}
    for date, regional_data in pivot_usage.groupby('Дата'):
        if REPORT_DATE - date.date() > dt.timedelta(days=366 + 31):
            continue
        date = date.date().isoformat()
        date_based_pivot_usage['Україна'][date] = regional_data.sum().to_dict()

    return date_based_pivot_usage


def compute_average_usage(usages: pd.DataFrame):
    average_usage = usages[(dt.date.today() - usages['Дата'].dt.date) < dt.timedelta(days=365)]\
    .pivot_table(index='Регіон',
                 columns='Міжнародна непатентована назва', 
                 values='Використано доз за звітний місяць при проведенні щеплень', 
                 aggfunc='mean'
    )
    average_usage.fillna(0, inplace=True)
    average_usage.loc['Україна'] = average_usage.sum(axis=0)

    return average_usage


def compute_usage_trends(pivot_usage: pd.DataFrame, REPORT_DATE: dt.date) -> pd.DataFrame:
    trends = pd.DataFrame(columns=pivot_usage.columns)
    unique_dates = [date for date in pivot_usage.index.get_level_values(
        0).unique() if (REPORT_DATE - date.date()) < dt.timedelta(days=365)]
    for i in range(1, len(unique_dates)):
        df_1 = pivot_usage.xs(unique_dates[i-1], level=0).copy()
        df_1.loc['Україна'] = df_1.sum()
        df_2 = pivot_usage.xs(unique_dates[i], level=0).copy()
        df_2.loc['Україна'] = df_2.sum()
        difference = df_2.sub(df_1).reset_index()
        difference['Дата'] = unique_dates[i]
        trends = pd.concat([trends, difference], axis=0)

    mean_trends = trends.groupby('Регіон')[pivot_usage.columns].mean()
    mean_trends.dropna(axis=1, how='all', inplace=True)
    mean_trends = mean_trends.fillna(0).astype(int)

    if CHECKUP_REQUIRED:
        mean_trends.to_excel(
            CHECKUP_FOLDER / 'Усереднений тренд використання у цьому році.xlsx')

    return mean_trends


def compute_usage_based_expiration_timelines(
    df: pd.DataFrame,
    waning_expiration_based_timelines: pd.DataFrame,
    average_usage: pd.DataFrame,
    expiration_timelines: pd.DataFrame,
    REPORT_DATE: dt.date,
    PICK_SUPPLIES_MASK: pd.Index,
    SUPPLY_SUFFIX: str = " (поставки)",
    specific_regions: t.List[str] | None = None
) -> t.Tuple[t.Dict[str, pd.DataFrame], t.Dict[str, pd.DataFrame], pd.DataFrame]:
    """Compute potentially available vaccine stock timelines based on the usage and expirations of the vaccines in each region.

    Args:
        df (pd.DataFrame): Main dataframe with the data
        waning_expiration_based_timelines (pd.DataFrame): Amounts of vaccines available in each regions based only on expiration dates
        average_usage (pd.DataFrame): Average monthly usage of vaccines in each region
        expiration_timelines (pd.DataFrame): Dataframe with indexes as dates, columns as vaccines and values as doses expired on the given day
        REPORT_DATE (dt.date): Date of the report
        PICK_SUPPLIES_MASK (pd.Index): Index of columns in the expiration_timelines dataframe that correspond to future supplies (0s for actual expiration dates and 1s for future supplies)
        SUPPLY_SUFFIX (str, optional): Suffix that defines the column as one containing information about future supplies. Defaults to " (поставки)".

    Returns:
        t.Tuple[t.Dict[str, pd.DataFrame], t.Dict[str, pd.DataFrame], pd.DataFrame]: Returns a tuple with three elements: 
            1) Forecasted stock for each region, based on usage: {Region: pd.DataFrame(index is datepoints, columns are vaccines, values are doses available on the given day based on usage)};

            2) Amount of vaccines expected to expire: {Region: pd.DataFrame(index is datepoints, columns are vaccines, values are doses expected to be wasted on the given day based on usage)};

            3) Amount of vaccines that are expected to expire if calculated for Ukraine as a whole (previous result just sums each region for Ukraine)
    """
    vaccines_with_unknown_usage = [vac for vac in df['Міжнародна непатентована назва'].unique(
    ).tolist() if vac not in average_usage.columns]
    usage_based_expiration_timelines = {}
    vaccines_expected_to_expire = {}

    if specific_regions:
        assert set(specific_regions).issubset(set(waning_expiration_based_timelines.keys(
        ))), "Specific regions should be a subset of all regions"
    for region in (specific_regions if specific_regions else waning_expiration_based_timelines):
        # if region == 'Україна': continue
        vaccines_leftovers_in_region = (df if region == "Україна" else df[df['Регіон'] == region]).groupby(
            'Міжнародна непатентована назва')['Кількість доз'].sum()
        vaccines_leftovers_in_region.name = REPORT_DATE
        vaccines_leftovers_in_region = vaccines_leftovers_in_region.to_frame().T

        vaccine_daily_usage_in_region = average_usage.loc[region]/30.5

        vaccine_daily_usage_in_region = vaccine_daily_usage_in_region.reindex(
            expiration_timelines[region].columns[ALL_SLICE if region != 'Україна' else ~PICK_SUPPLIES_MASK], fill_value=0)
        available_vaccine_used = pd.Series(
            data=0, index=expiration_timelines[region].columns[ALL_SLICE if region != 'Україна' else ~PICK_SUPPLIES_MASK])
        total_expiring_vaccines_in_region = pd.Series(
            data=0, index=expiration_timelines[region].columns[ALL_SLICE if region != 'Україна' else ~PICK_SUPPLIES_MASK])
        vaccines_expected_to_expire_in_region = pd.DataFrame(
            columns=expiration_timelines[region].columns[ALL_SLICE if region != 'Україна' else ~PICK_SUPPLIES_MASK])
        available_vaccines_expected_to_expire = 0
        vaccines_rendered_unavailable = 0

        prev_date = None
        for expiration_date in waning_expiration_based_timelines[region].index:
            days_passed = (expiration_date -
                           (prev_date if prev_date else REPORT_DATE)).days

            # Expected usage of some vaccine in the region in this time period
            # Plus the amount of vaccines that we expect to expire in the previous time period
            # (vaccines that expired in the previous time period are additional loss and should be added to the usage)
            # minus the lot volumes that expired in the previous time period (vaccines that are not available anymore. It is always "what was used" + "what expired")
            # Leaving only the usage of the lots that have not expired yet
            vaccine_used = vaccine_daily_usage_in_region * days_passed
            available_vaccine_used += (
                vaccine_used + available_vaccines_expected_to_expire - vaccines_rendered_unavailable)

            if region != 'Україна':
                vaccines_rendered_unavailable = expiration_timelines[region].loc[expiration_date] if (
                    expiration_date in expiration_timelines[region].index) else pd.Series(data=0, index=expiration_timelines[region].columns)
            else:
                vaccines_rendered_unavailable = expiration_timelines[region].loc[expiration_date, ~PICK_SUPPLIES_MASK] if (
                    expiration_date in expiration_timelines[region].index) else pd.Series(data=0, index=expiration_timelines[region].columns[~PICK_SUPPLIES_MASK])

            # How many vaccines of some lot are actually expiring on the current day
            # minus how many vaccines of that lot are expected to be consumed by the end of the day
            # Assuming FEFO, if we used more vaccines than available in the lot, we defineteley used "the ones that are expiring" first
            available_vaccines_expected_to_expire = (
                vaccines_rendered_unavailable - available_vaccine_used).clip(lower=0)
            vaccines_expected_to_expire_in_region.loc[expiration_date] = available_vaccines_expected_to_expire

            latest_vaccines_leftovers_in_region = (
                vaccines_leftovers_in_region.iloc[-1] - available_vaccines_expected_to_expire - vaccine_used)
            # Determine overconsumption and remove it from available_vaccine_used
            overconsumption = latest_vaccines_leftovers_in_region.clip(upper=0)
            available_vaccine_used += overconsumption

            # Ensure we didn't use more vaccines than we had!
            latest_vaccines_leftovers_in_region = latest_vaccines_leftovers_in_region.clip(
                lower=0)
            # Add new supplies to the count
            if region == 'Україна' and expiration_date in expiration_timelines[region].index:
                new_supplies = expiration_timelines[region].loc[expiration_date,
                                                                PICK_SUPPLIES_MASK]
                latest_vaccines_leftovers_in_region = latest_vaccines_leftovers_in_region.add(
                    new_supplies.rename(index=lambda x: x[:-len(SUPPLY_SUFFIX)]), fill_value=0)

            latest_vaccines_leftovers_in_region.name = expiration_date

            vaccines_leftovers_in_region = pd.concat(
                [vaccines_leftovers_in_region, latest_vaccines_leftovers_in_region.to_frame().T], axis=0)

            prev_date = expiration_date

        vaccines_leftovers_in_region.index = vaccines_leftovers_in_region.index.astype(
            str)
        usage_based_expiration_timelines[region] = vaccines_leftovers_in_region.drop_duplicates(
        ).astype(int)

        vaccines_expected_to_expire_in_region = vaccines_expected_to_expire_in_region[[
            col for col in vaccines_expected_to_expire_in_region.columns if col not in vaccines_with_unknown_usage]]
        vaccines_expected_to_expire_in_region = vaccines_expected_to_expire_in_region[(
            vaccines_expected_to_expire_in_region != 0).any(axis=1)]
        vaccines_expected_to_expire_in_region.index = vaccines_expected_to_expire_in_region.index.astype(
            str)
        vaccines_expected_to_expire[region] = vaccines_expected_to_expire_in_region.astype(
            int)

    ukraine_based_expiration: pd.DataFrame = vaccines_expected_to_expire['Україна']
    if specific_regions != ['Україна']:
        vaccines_expected_to_expire['Україна'] = pd.concat([values for reg, values in vaccines_expected_to_expire.items(
        ) if reg != 'Україна'], axis=0).fillna(0).astype(int).reset_index().groupby('index').sum()

    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Залишки, базуючись на використанні і термінах придатності',
                   exist_ok=True, parents=True)
        for region in usage_based_expiration_timelines:
            usage_based_expiration_timelines[region].to_excel(
                CHECKUP_FOLDER / 'Залишки, базуючись на використанні і термінах придатності/Дані.xlsx', sheet_name=region)

    return usage_based_expiration_timelines, vaccines_expected_to_expire, ukraine_based_expiration


def _has_index(lst, index):
    return -len(lst) <= index < len(lst)

def accumulate(
    REPORT_DATE: dt.date,
    df: pd.DataFrame,
    region_with_foundsource_df: pd.DataFrame,
    timed_out_reports: pd.DataFrame,
    region_df: pd.DataFrame,
    vaccines_left_sorted: pd.DataFrame,
    institutional_level_data_df: pd.DataFrame,
    average_usage: pd.DataFrame,
    mean_trends: pd.DataFrame,
    date_based_pivot_usage: pd.DataFrame,
    future_supplies_export: pd.DataFrame,
    waning_expiration_based_timelines: t.Dict[str, pd.DataFrame],
    vaccines_expected_to_expire: t.Dict[str, pd.DataFrame],
    expiration_timelines: t.Dict[str, pd.DataFrame],
    usage_based_expiration_timelines: t.Dict[str, pd.DataFrame],
    no_future_supplies_usage_based_expiration_timelines_for_ukraine: t.Dict[str, pd.DataFrame],
    source_filepath: Path = 'src/app-source.js',
    destination_filepath: Path = 'src/app.js',
    report_type: str = "Routine"
):
    import json

    html = open(source_filepath, 'r').read()
    html = html.replace('{', '{{')
    html = html.replace('}', '}}')
    html = html.replace('}}*/', '}')
    html = html.replace('/*{{', '{')
    NAME_PLACEHOLDER = 'Немає вакцини'
    VALUE_PLACEHOLDER = 'N/A'
    print(
        html.format(
            # ———————————————————————————————————— Date. PRE_HEAD SECTION ————————————————————————————————————
            report_type,
            f'{REPORT_DATE.year}-{REPORT_DATE.month:0>2}-{REPORT_DATE.day:0>2}',
            json.dumps(ukraine_map_json),
            json.dumps(sorted(df['Міжнародна непатентована назва'].unique().tolist())),

            # —————————————————————————————————— Regional Chart. SECTION 1 ———————————————————————————————————
            # json.dumps(region_df.columns.tolist(), ensure_ascii=False),
            # json.dumps(region_df.to_dict('list'), ensure_ascii=False),
            # json.dumps(region_df.index.tolist(), ensure_ascii=False),
            json.dumps(region_with_foundsource_df.to_dict(
                'list'), ensure_ascii=False),
            get_nationalStock_with_storage().to_json(orient='columns', force_ascii=False),
            # —————————————————————————————————— Regional Chart. SECTION 1 ———————————————————————————————————
            # ——————————————————————————————————— Regional HTML. SECTION 2 ———————————————————————————————————
            # Timed out stock reports
            timed_out_reports.to_json(orient='split', force_ascii=False),

            # Overall leftovers
            f'{int(region_df.sum().sum()):,}',
            # The most leftovers
            first_region if (first_region := region_df.index[region_df.sum(
                axis=1).argmax()]) != "Україна" else "НацСклади",
            f'{int(region_df.sum(axis=1).max()):,}',
            # The least leftovers
            last_region if (last_region := region_df.index[region_df.sum(
                axis=1).argmin()]) != "Україна" else "НацСклади",
            f'{int(region_df.sum(axis=1).min()):,}',

            # Top-3 vaccines left
            vaccines_left_sorted.iloc[0].name if _has_index(vaccines_left_sorted, 0)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[0][0]):,}' if _has_index(vaccines_left_sorted, 0)  else VALUE_PLACEHOLDER,
            vaccines_left_sorted.iloc[1].name if _has_index(vaccines_left_sorted, 1)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[1][0]):,}' if _has_index(vaccines_left_sorted, 1)  else VALUE_PLACEHOLDER,
            vaccines_left_sorted.iloc[2].name if _has_index(vaccines_left_sorted, 2)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[2][0]):,}' if _has_index(vaccines_left_sorted, 2)  else VALUE_PLACEHOLDER,

            # Top-3 vaccines absent
            vaccines_left_sorted.iloc[-1].name if _has_index(vaccines_left_sorted, -1)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[-1][0]):,}' if _has_index(vaccines_left_sorted, -1)  else VALUE_PLACEHOLDER,
            vaccines_left_sorted.iloc[-2].name if _has_index(vaccines_left_sorted, -2)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[-2][0]):,}' if _has_index(vaccines_left_sorted, -2)  else VALUE_PLACEHOLDER,
            vaccines_left_sorted.iloc[-3].name if _has_index(vaccines_left_sorted, -3)  else NAME_PLACEHOLDER,
            f'{int(vaccines_left_sorted.iloc[-3][0]):,}' if _has_index(vaccines_left_sorted, -3)  else VALUE_PLACEHOLDER,
            # ——————————————————————————————————— Regional HTML. SECTION 2 ———————————————————————————————————

            # ———————————————————————————————— Institutional Chart. SECTION 3 ————————————————————————————————
            institutional_level_data_df.to_json(
                orient='records', force_ascii=False),
            # ———————————————————————————————— Institutional Chart. SECTION 3 ————————————————————————————————

            # ——————————————————————————— SECTION 5. Leftovers+Usages+Expirations ————————————————————————————
            json.dumps({region: frame.drop_duplicates() for region, frame in waning_expiration_based_timelines.items(
            )}, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            json.dumps(vaccines_expected_to_expire, default=lambda obj: pd.DataFrame.to_json(
                obj, orient='split', force_ascii=False)),
            json.dumps(expiration_timelines, default=lambda obj: pd.DataFrame.to_json(
                obj, orient='split', force_ascii=False)),
            average_usage.to_json(orient='index', force_ascii=False),
            json.dumps(date_based_pivot_usage, ensure_ascii=False),
            mean_trends.to_json(orient='index', force_ascii=False),
            json.dumps(future_supplies_export),
            json.dumps(no_future_supplies_usage_based_expiration_timelines_for_ukraine,
                       default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            # ——————————————————————————— SECTION 5. Leftovers+Usages+Expirations ————————————————————————————

            # ——————————————————————————————————————— Main App Section ———————————————————————————————————————
            json.dumps(usage_based_expiration_timelines, default=lambda obj: pd.DataFrame.to_json(
                obj, orient='split', force_ascii=False)),
            # ——————————————————————————————————————— Main App Section ———————————————————————————————————————

        ),

        file=open(destination_filepath, 'w')
    )
