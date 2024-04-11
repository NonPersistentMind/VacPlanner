import pandas as pd, os, re, datetime as dt, scipy, typing as t, logging, warnings, sys
from pathlib import Path
from matplotlib import pyplot as plt
plt.style.use('fivethirtyeight')

from utils import *
from config import *

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
        raise ValueError(f'Filename {filename} does not contain a date in the format "YYYY-MM-DD"')
        

def get_latest_file(DATA_FOLDER: str | Path) -> Path:
    LATEST_FILE = sorted([filename for filename in DATA_FOLDER.iterdir() if filename.stem not in ['.DS_Store', 'Auxillary', 'Historical Data']], key=lambda fn: dt.date.fromisoformat(fn.name[-5 - 10:-5]))[-1]        
    return LATEST_FILE

def _assume_report_date(df: pd.DataFrame) -> pd.Timestamp:
    return df['дата оновлення'].max().to_pydatetime()

def _inverse_correction(df: pd.DataFrame, target: str, based_on: str, new_label:str = None, method:str = "popular", verbose: bool = False) -> None:
    # ———————————————————————————— Визначити назву вакцини за серією препарату і переписати назви у вхідних даних ————————————————————————————
    series_df = df.groupby([based_on])[target].apply(lambda entries: [[entry, len(entries[entries==entry])] for entry in entries.unique() if not pd.isna(entry)]).reset_index()

    if verbose:
        # Вивести "based_on" без жодного варіанту 
        series_df[series_df[target].apply(lambda entries: len(entries))==0].to_excel(RESULTS_FOLDER / f'{based_on} без {target}.xlsx', index=False)
        # Вивести  "based_on" з багатьма варіантами "target"
        series_df[series_df[target].apply(lambda entries: len(entries))>1].to_excel(RESULTS_FOLDER / f'{based_on} з багатьма варіантами {target}.xlsx', index=False)

    # Залишити тільки серії, де є хоча б одна назва препарату
    series_df = series_df[~(series_df[target].apply(lambda entries: len(entries))==0)]

    # Обрати назву препарату, яка найчастіше зустрічається в серії
    overwritings = series_df.apply(lambda row: max(row[target], key=lambda pair: pair[1])[0], axis=1)
    series_df[new_label if new_label else ("Нова " + target)] = overwritings

    series_df = series_df[[based_on, new_label if new_label else ("Нова " + target)]].set_index(based_on)

    df[target] = df[[based_on, target]].apply(lambda row: series_df.to_dict()[new_label if new_label else ("Нова " + target)].get(row[based_on], row[target]), axis=1)
    # ————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

def _clean_data(df: pd.DataFrame) -> None:
    df.columns = df.columns.str.strip()
    df.rename(columns={'Серія препарту': 'Серія препарату'}, inplace=True)

    # ————————————————————————————————————————————————————— Temporary Middleware Section —————————————————————————————————————————————————————
    df['Заклад'] = df['Заклад'].str.strip()
    df['Кількість доз'] = df['Кількість доз'].astype(int)
    df['Регіон'] = df['Регіон'].str.replace(' область', '')
    df['Регіон'] = df['Регіон'].str.replace(' обл.', '')
    df['Регіон'] = df['Регіон'].str.replace(' обл', '')
    
    df = df[df["Міжнародна непатентована назва"].notna()]
    df['Регіон'] = df['Регіон'].replace('чЕРНІГІВСЬКА ОБЛАСТЬ', 'Чернігівська область')
    df['Джерело фінансування'] = df['Джерело фінансування'].fillna('Невідоме джерело')
    df['Джерело фінансування'] = df['Джерело фінансування'].replace(['Держбюджет', 'Державний бюджет'], 'Державний бюджет (невідомий рік)')
    # ————————————————————————————————————————————————————— Temporary Middleware Section —————————————————————————————————————————————————————
    
    _inverse_correction(df, 'Міжнародна непатентована назва', 'Серія препарату', new_label='Назва препарату')
    _inverse_correction(df, 'Заклад', 'код ЄДРПОУ', new_label='Назва закладу')

    df['Міжнародна непатентована назва'] = df['Міжнародна непатентована назва'].replace(vaccine_shorts)
    df = df[~df['Міжнародна непатентована назва'].isin(VACCINES_SKIPPED)]

    df['дата оновлення'] = pd.to_datetime(df['дата оновлення'], dayfirst=True)
    df['Термін придатності'] = pd.to_datetime(df['Термін придатності'], dayfirst=True)

    # Remove any data reporting vaccine with expiration date older than the latest report date
    REPORT_DATE = _assume_report_date(df)
    df.loc[df['дата оновлення'].isna(), 'дата оновлення'] = REPORT_DATE - dt.timedelta(days=14)
    timed_outs = df[(REPORT_DATE - df['дата оновлення']) > dt.timedelta(days=7)]
    df = df[df['Термін придатності'] > REPORT_DATE]
    
    df['Термін придатності'] = df['Термін придатності'].dt.date
    
    return df, REPORT_DATE.date(), timed_outs


def get_data(
        national_stock_filepath: Path = DATA_FOLDER/'Auxillary'/'Залишки нацрівня.xlsx',
        autosave: bool = True,
        refresh=False
    ) -> t.Tuple[pd.DataFrame, dt.date, pd.DataFrame, pd.DataFrame]:
    if SPECIFIC_DATASOURCE:
        filepath = SPECIFIC_DATASOURCE
        filename = filepath
    else:
        filepath = get_latest_file(DATA_FOLDER)
        filename = filepath.name
        
    log(f"Starting to process {filename[:40] + (len(filename) > 40 and '...' or '')}")
    
    # If filepath is a valid http[s] url, download the file and process it
    if filename.startswith('http://') or filename.startswith('https://'):
        URL = True
        filedate = dt.date.today()
        filedate = {'year': filedate.year, 'month': filedate.month, 'day': filedate.day}
    else:
        URL = False
        filedate = get_filename_date(filepath.stem)
        
    national_leftovers_df = get_national_leftovers(national_stock_filepath)
    
    if refresh or not Path.exists(DATA_FOLDER / 'Historical Data' / f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}.pkl'):
        df = pd.read_csv(filepath) if URL else pd.read_excel(
            filepath, 
            sheet_name='Залишки поточні', 
            dtype={' код ЄДРПОУ': str}, 
            engine='openpyxl'
        )
        df, REPORT_DATE, timed_outs = _clean_data(df)
        
        df = pd.concat([df, national_leftovers_df[national_leftovers_df['Дата поставки'].isna()][['Міжнародна непатентована назва', 'Регіон', 'Термін придатності', 'Кількість доз', 'Джерело фінансування']]], ignore_index=True)

        if autosave:
            # Save preprocessed data
            Path.mkdir(DATA_FOLDER / 'Historical Data', exist_ok=True, parents=True)
            df.to_pickle(DATA_FOLDER / 'Historical Data' / f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}.pkl')
            timed_outs.to_pickle(DATA_FOLDER / 'Historical Data' / f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}_timed_outs.pkl')
    else:
        df = pd.read_pickle(DATA_FOLDER / 'Historical Data' / f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}.pkl')
        timed_outs = pd.read_pickle(DATA_FOLDER / 'Historical Data' / f'{filedate["year"]}-{filedate["month"]}-{filedate["day"]}_timed_outs.pkl')
        REPORT_DATE = _assume_report_date(df).date()
        
    log(f"Data loaded. {REPORT_DATE} is the file's report date.")
    return df, REPORT_DATE, timed_outs, national_leftovers_df


def get_national_leftovers(filepath: Path = DATA_FOLDER/'Auxillary'/'Залишки нацрівня.xlsx') -> pd.DataFrame:
    national_leftovers_df = pd.read_excel(SPECIFIC_NATIONAL_STOCK_FILE or filepath, sheet_name='Залишки і поставки')
    national_leftovers_df.rename(columns={'Вакцина': 'Міжнародна непатентована назва', 'Залишок': 'Кількість доз'}, inplace=True)
    national_leftovers_df['Міжнародна непатентована назва'] = national_leftovers_df['Міжнародна непатентована назва'].replace('Хіб', 'ХІБ')
    national_leftovers_df['Регіон'] = 'Україна'
    national_leftovers_df['Термін придатності'] = national_leftovers_df['Термін придатності'].dt.date 
    national_leftovers_df['Дата поставки'] = pd.to_datetime(national_leftovers_df['Дата поставки']).dt.date 
    return national_leftovers_df
    

def compute_future_supplies(national_leftovers_df: pd.DataFrame) -> pd.DataFrame:
    future_supplies_data = national_leftovers_df[national_leftovers_df['Дата поставки'].notna()]
    if SKIP_FUTURE_SUPPLIES:
        future_supplies_data.loc[:, 'Кількість доз'] = 0
    
    if TESTING:
        assert future_supplies_data['Дата поставки'].notna().all(), "Не для всіх майбутніх поставок вакцин вказана дата поставки"

    return future_supplies_data

def compute_future_supplies_export(future_supplies_data: pd.DataFrame, extended=False) -> t.Dict[str, t.Dict[str, int] ]:
    temporary_df = future_supplies_data.copy()

    temporary_df['Дата поставки'] = temporary_df['Дата поставки'].apply(lambda x: x.strftime('%Y-%m-%d'))
    future_supplies_export = {}

    for vaccine, supplies in temporary_df.groupby('Міжнародна непатентована назва'):
        if extended:
            res = supplies.groupby('Дата поставки')[['Кількість доз', 'Відповідальний за імпорт']].aggregate({'Кількість доз': 'sum', 'Відповідальний за імпорт': lambda x: ', '.join(x.unique())}).to_dict(orient='index')
        else:
            res = supplies.groupby('Дата поставки')['Кількість доз'].sum().to_dict()
        future_supplies_export[vaccine] = res

    return future_supplies_export


def compute_timed_outs_report(timed_outs: pd.DataFrame) -> pd.DataFrame:
    return timed_outs.groupby('Регіон')[['Кількість доз', 'Заклад']].apply(lambda group: [group['Кількість доз'].sum(), group['Заклад'].unique()]).sort_values(ascending=False)


def compute_region_with_foundsource_df(df: pd.DataFrame) -> pd.DataFrame:
    return df.groupby(['Регіон', "Міжнародна непатентована назва", 'Джерело фінансування'])['Кількість доз'].sum().reset_index()


def compute_region_df(df: pd.DataFrame, REPORT_DATE: dt.date, autosave: bool = True) -> pd.DataFrame:
    region_df = df.groupby(["Регіон", "Міжнародна непатентована назва"])[['Кількість доз']].sum().reset_index()
    region_df = region_df.pivot_table(values='Кількість доз', columns='Регіон', index='Міжнародна непатентована назва').fillna(0).astype(int).T
    region_df.sort_index(key=lambda index: pd.Index(region_positions[x] for x in index), inplace=True)
    
    if CHECKUP_REQUIRED and autosave:
        region_df.to_excel(CHECKUP_FOLDER / f'Залишки по регіонах на {REPORT_DATE}.xlsx')

    return region_df

def compute_vaccines_left_sorted(region_df: pd.DataFrame) -> pd.DataFrame:
    vaccines_left_sorted = region_df.sum(axis=0).sort_values(ascending=False).to_frame()
    return vaccines_left_sorted

def compute_institutional_data(df: pd.DataFrame) -> pd.DataFrame:
    institutional_level_data_df = df.groupby(['Регіон', 'Заклад', 'Міжнародна непатентована назва'], dropna=False)[['Кількість доз']].sum().reset_index()
    institutional_level_data_df.replace('Україна', 'НацСклади', inplace=True)

    institutional_level_data_df['Заклад'] = institutional_level_data_df['Заклад'].fillna('Невідомий заклад')
    institutional_level_data_df['Міжнародна непатентована назва'] = institutional_level_data_df['Міжнародна непатентована назва'].fillna('Невідома вакцина')
    institutional_level_data_df.rename(columns={'Заклад': 'Fclt', 'Міжнародна непатентована назва': 'Name', 'Кількість доз': 'Amnt', 'Регіон':'Rgn'}, inplace=True)

    return institutional_level_data_df

def compute_expiration_timelines(
        df: pd.DataFrame, 
        national_leftovers_df: pd.DataFrame, 
        SUPPLY_SUFFIX:str = " (поставки)",
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
    
    if specific_regions: assert (set(specific_regions) - {'Україна'}).issubset(set(df['Регіон'].unique())), "Specific regions should be a subset of all regions"
    for region, region_data in df.groupby('Регіон'):
        if specific_regions and region not in specific_regions:
            continue
        regional_expirations = pd.DataFrame()
        for vaccine, vaccine_data in region_data.groupby('Міжнародна непатентована назва'):
            vaccine_data = vaccine_data.groupby('Термін придатності')[['Кількість доз']].sum()

            vaccine_data.rename(columns={'Кількість доз': vaccine}, inplace=True)
            regional_expirations = pd.concat([regional_expirations, vaccine_data], axis=1)

            regional_expirations.fillna(0, inplace=True)
            regional_expirations.sort_index(inplace=True)
            
        expiration_timelines[region] = regional_expirations

    # Separately for Ukraine as a whole
    regional_expirations = pd.DataFrame()
    for vaccine, vaccine_data in df.groupby('Міжнародна непатентована назва'):
        vaccine_data = vaccine_data.groupby('Термін придатності')[['Кількість доз']].sum()        
        
        vaccine_data.rename(columns={'Кількість доз': vaccine}, inplace=True)
        regional_expirations = pd.concat([regional_expirations, vaccine_data], axis=1)
        
    # Add future supplies to the Ukrainian expiration timelines
    future_supplies_data = compute_future_supplies(national_leftovers_df)
    if not include_future_supplies:
        future_supplies_data['Кількість доз'] = 0

    for index, data in future_supplies_data.groupby(['Дата поставки', 'Міжнародна непатентована назва', ]):
        # Add future supplies as a separate column in the expiration timelines
        regional_expirations.loc[index[0], index[1]+SUPPLY_SUFFIX] = data['Кількість доз'].sum()
        
        for expiration_date, doses in data.groupby('Термін придатності', dropna=False)['Кількість доз']:
            if pd.isna(expiration_date):
                expiration_date = index[0] + DEFAULT_SHELF_LIFE
                
            if expiration_date not in regional_expirations.index:
                regional_expirations.loc[expiration_date] = 0
                
            regional_expirations.loc[expiration_date, index[1]] += doses.sum()

    PICK_SUPPLIES_MASK = regional_expirations.columns.map(lambda x: x.endswith(SUPPLY_SUFFIX))

    regional_expirations.fillna(0, inplace=True)
    regional_expirations.sort_index(inplace=True)

    expiration_timelines["Україна"] = regional_expirations
    
    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Псування за терміном придатності', exist_ok=True, parents=True)
        for region in expiration_timelines:
            expiration_timelines[region].to_excel(CHECKUP_FOLDER/'Псування за терміном придатності' / f'{region}.xlsx')
            
    if TESTING:
        for region in expiration_timelines:
            if region == 'Україна':
                continue
            for vaccine in df[df['Регіон'] == region]['Міжнародна непатентована назва'].unique():
                test_frame = df[ (df['Регіон']==region) 
                    & (df['Міжнародна непатентована назва']==vaccine) 
                ].groupby(["Термін придатності", ])["Кількість доз"].sum()
                
                assert (expiration_timelines[region][vaccine][expiration_timelines[region][vaccine]!=0] == test_frame).all(), f"Expiration timelines for {region} and {vaccine} do not match"
      
    return expiration_timelines, PICK_SUPPLIES_MASK

def compute_waning_expiration_based_timelines(
        df: pd.DataFrame, 
        expiration_timelines: pd.DataFrame, 
        REPORT_DATE: dt.date, 
        PICK_SUPPLIES_MASK: pd.Index, 
        SUPPLY_SUFFIX:str = " (поставки)",
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
    
    if specific_regions: assert set(specific_regions).issubset(set(expiration_timelines.keys())), "Specific regions should be a subset of all regions"
    for region in (specific_regions if specific_regions else expiration_timelines):
        vaccine_stock_in_region = (df if region=="Україна" else df[df['Регіон']==region]).groupby('Міжнародна непатентована назва')['Кількість доз'].sum()
        vaccine_stock_in_region.name = REPORT_DATE
        
        region_data = expiration_timelines[region].cumsum(axis=0)
        if region == 'Україна' and include_future_supplies:
            region_data = (vaccine_stock_in_region - region_data.loc[:, ~PICK_SUPPLIES_MASK]).add(region_data.loc[:, PICK_SUPPLIES_MASK].rename(columns=lambda x: x[:-len(SUPPLY_SUFFIX)]), fill_value=0)
        else:
            region_data = vaccine_stock_in_region - region_data
            
        region_data = pd.concat([vaccine_stock_in_region.to_frame().T, region_data], axis=0)
        
        region_data.index = pd.to_datetime(region_data.index)
        
        region_data = region_data.reindex(region_data.index.append(region_data.resample('W').asfreq().index).drop_duplicates().sort_values()).ffill()
        
        region_data.index = region_data.index.date
        
        waning_expiration_based_timelines[region] = region_data
    
    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Залишки, базуючись лише на терміні придатності', exist_ok=True, parents=True)
        for region in waning_expiration_based_timelines:
            waning_expiration_based_timelines[region].to_excel(CHECKUP_FOLDER / 'Залишки, базуючись лише на терміні придатності'/f'{region}.xlsx')
    
    return waning_expiration_based_timelines


def get_usage(filepath: Path = DATA_FOLDER / "Auxillary" / "Використання.csv") -> pd.DataFrame:
    # usages = pd.read_csv(filepath)
    log(f"Starting to prepare usage data.")
    usages = pd.read_excel(DATA_FOLDER / "Auxillary" / "ВСЬОГО.xlsx", engine='openpyxl', sheet_name='Використання')
    
    usages['Дата'] = pd.to_datetime(usages['Дата'])
    usages['Міжнародна непатентована назва'] = usages['Міжнародна непатентована назва'].replace(vaccine_shorts)
    usages['Регіон'] = usages['Регіон'].replace("Київ", "м. Київ")
    
    return usages


def compute_pivot_usage(usages: pd.DataFrame, vaccines_tracked: t.Iterable) -> pd.DataFrame:
    pivot_usage = usages.pivot_table(index=['Дата', "Регіон"], columns='Міжнародна непатентована назва', values='Використано доз за звітний місяць при проведенні щеплень', aggfunc='sum')
    pivot_usage.columns.name = None
    pivot_usage = pivot_usage[[x for x in pivot_usage.columns if x in vaccines_tracked]]
    
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
            date_based_pivot_usage[region][date] = regional_data.iloc[0].to_dict()
            
    # Add Ukraine as well
    date_based_pivot_usage['Україна'] = {}
    for date, regional_data in pivot_usage.groupby('Дата'):
        if REPORT_DATE - date.date() > dt.timedelta(days=366 + 31):
            continue
        date = date.date().isoformat()
        date_based_pivot_usage['Україна'][date] = regional_data.sum().to_dict()
        
    return date_based_pivot_usage


def compute_average_usage(usages: pd.DataFrame):
    average_usage = usages[(dt.date.today() - usages['Дата'].dt.date) < dt.timedelta(days=365)].pivot_table(index='Регіон', columns='Міжнародна непатентована назва', values='Використано доз за звітний місяць при проведенні щеплень', aggfunc='mean')
    average_usage.fillna(0, inplace=True)
    average_usage.loc['Україна'] = average_usage.sum(axis=0)
    
    return average_usage


def compute_usage_trends(pivot_usage: pd.DataFrame, REPORT_DATE: dt.date) -> pd.DataFrame:
    trends = pd.DataFrame(columns=pivot_usage.columns)
    unique_dates = [date for date in pivot_usage.index.get_level_values(0).unique() if (REPORT_DATE - date.date()) < dt.timedelta(days=365)]
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
    mean_trends = mean_trends.astype(int)
    
    if CHECKUP_REQUIRED:
        mean_trends.to_excel(CHECKUP_FOLDER / 'Усереднений тренд використання у цьому році.xlsx')
    
    return mean_trends


def compute_usage_based_expiration_timelines(
        df: pd.DataFrame, 
        waning_expiration_based_timelines: pd.DataFrame, 
        average_usage: pd.DataFrame, 
        expiration_timelines: pd.DataFrame, 
        REPORT_DATE: dt.date, 
        PICK_SUPPLIES_MASK: pd.Index, 
        SUPPLY_SUFFIX:str = " (поставки)",
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
    vaccines_with_unknown_usage = [vac for vac in df['Міжнародна непатентована назва'].unique().tolist() if vac not in average_usage.columns]
    usage_based_expiration_timelines = {}
    vaccines_expected_to_expire = {}

    if specific_regions: assert set(specific_regions).issubset(set(waning_expiration_based_timelines.keys())), "Specific regions should be a subset of all regions"
    for region in (specific_regions if specific_regions else waning_expiration_based_timelines):
        # if region == 'Україна': continue
        vaccines_leftovers_in_region = (df if region=="Україна" else df[df['Регіон']==region]).groupby('Міжнародна непатентована назва')['Кількість доз'].sum()
        vaccines_leftovers_in_region.name = REPORT_DATE
        vaccines_leftovers_in_region = vaccines_leftovers_in_region.to_frame().T
        
        vaccine_daily_usage_in_region = average_usage.loc[region]/30.5
        
        vaccine_daily_usage_in_region = vaccine_daily_usage_in_region.reindex(expiration_timelines[region].columns[ALL_SLICE if region!='Україна' else ~PICK_SUPPLIES_MASK], fill_value=0)
        available_vaccine_used = pd.Series(data=0, index=expiration_timelines[region].columns[ALL_SLICE if region!='Україна' else ~PICK_SUPPLIES_MASK])
        total_expiring_vaccines_in_region = pd.Series(data=0, index=expiration_timelines[region].columns[ALL_SLICE if region!='Україна' else ~PICK_SUPPLIES_MASK])
        vaccines_expected_to_expire_in_region = pd.DataFrame(columns=expiration_timelines[region].columns[ALL_SLICE if region!='Україна' else ~PICK_SUPPLIES_MASK])
        available_vaccines_expected_to_expire = 0
        vaccines_rendered_unavailable = 0
        
        prev_date = None
        for expiration_date in waning_expiration_based_timelines[region].index:
            days_passed = (expiration_date - (prev_date if prev_date else REPORT_DATE)).days
            
            # Expected usage of some vaccine in the region in this time period
            # Plus the amount of vaccines that we expect to expire in the previous time period 
            # (vaccines that expired in the previous time period are additional loss and should be added to the usage)
            # minus the lot volumes that expired in the previous time period (vaccines that are not available anymore. It is always "what was used" + "what expired")
            # Leaving only the usage of the lots that have not expired yet
            vaccine_used = vaccine_daily_usage_in_region * days_passed
            available_vaccine_used += (vaccine_used + available_vaccines_expected_to_expire - vaccines_rendered_unavailable)
            
            if region != 'Україна':
                vaccines_rendered_unavailable = expiration_timelines[region].loc[expiration_date] if (expiration_date in expiration_timelines[region].index) else pd.Series(data=0, index=expiration_timelines[region].columns)
            else:
                vaccines_rendered_unavailable = expiration_timelines[region].loc[expiration_date, ~PICK_SUPPLIES_MASK] if (expiration_date in expiration_timelines[region].index) else pd.Series(data=0, index=expiration_timelines[region].columns[~PICK_SUPPLIES_MASK])
                
            # How many vaccines of some lot are actually expiring on the current day
            # minus how many vaccines of that lot are expected to be consumed by the end of the day
            # Assuming FEFO, if we used more vaccines than available in the lot, we defineteley used "the ones that are expiring" first
            available_vaccines_expected_to_expire = (vaccines_rendered_unavailable - available_vaccine_used).clip(lower=0)
            vaccines_expected_to_expire_in_region.loc[expiration_date] = available_vaccines_expected_to_expire
            
            # latest_vaccines_leftovers_in_region = (vaccines_leftovers_in_region.iloc[-1] - available_vaccines_expected_to_expire - vaccine_used).clip(lower=0)
            latest_vaccines_leftovers_in_region = (vaccines_leftovers_in_region.iloc[-1] - available_vaccines_expected_to_expire - vaccine_used)
            overconsumption = latest_vaccines_leftovers_in_region.clip(upper=0)
            available_vaccine_used += overconsumption
            
            # Ensure we didn't use more vaccines than we had
            latest_vaccines_leftovers_in_region = latest_vaccines_leftovers_in_region.clip(lower=0)
            # Add new supplies to the count
            if region == 'Україна' and expiration_date in expiration_timelines[region].index:
                new_supplies = expiration_timelines[region].loc[expiration_date, PICK_SUPPLIES_MASK]
                latest_vaccines_leftovers_in_region = latest_vaccines_leftovers_in_region.add(new_supplies.rename(index=lambda x: x[:-len(SUPPLY_SUFFIX)]), fill_value=0)

            latest_vaccines_leftovers_in_region.name = expiration_date
            
            vaccines_leftovers_in_region = pd.concat([vaccines_leftovers_in_region, latest_vaccines_leftovers_in_region.to_frame().T], axis=0)
            
            prev_date = expiration_date
        
        vaccines_leftovers_in_region.index = vaccines_leftovers_in_region.index.astype(str)
        usage_based_expiration_timelines[region] = vaccines_leftovers_in_region.drop_duplicates().astype(int)

        vaccines_expected_to_expire_in_region = vaccines_expected_to_expire_in_region[[col for col in vaccines_expected_to_expire_in_region.columns if col not in vaccines_with_unknown_usage]]
        vaccines_expected_to_expire_in_region = vaccines_expected_to_expire_in_region[(vaccines_expected_to_expire_in_region != 0).any(axis=1)]
        vaccines_expected_to_expire_in_region.index = vaccines_expected_to_expire_in_region.index.astype(str)
        vaccines_expected_to_expire[region] = vaccines_expected_to_expire_in_region.astype(int)
    
    ukraine_based_expiration: pd.DataFrame = vaccines_expected_to_expire['Україна']
    if specific_regions != ['Україна']:
        vaccines_expected_to_expire['Україна'] = pd.concat([values for reg, values in vaccines_expected_to_expire.items() if reg!='Україна'], axis=0).fillna(0).astype(int).reset_index().groupby('index').sum()    

    if CHECKUP_REQUIRED:
        Path.mkdir(CHECKUP_FOLDER/'Залишки, базуючись на використанні і термінах придатності', exist_ok=True, parents=True)
        for region in usage_based_expiration_timelines:
            usage_based_expiration_timelines[region].to_excel(CHECKUP_FOLDER / 'Залишки, базуючись на використанні і термінах придатності/Дані.xlsx', sheet_name=region)

    return usage_based_expiration_timelines, vaccines_expected_to_expire, ukraine_based_expiration


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
        destination_filepath: Path = 'src/app.js'
    ):
    import json

    html = open(source_filepath, 'r').read()
    html = html.replace('{', '{{')
    html = html.replace('}', '}}')
    html = html.replace('}}*/', '}')
    html = html.replace('/*{{', '{')
    print(
        html.format(
            # ———————————————————————————————————— Date. PRE_HEAD SECTION ————————————————————————————————————
            f'{REPORT_DATE.year}-{REPORT_DATE.month:0>2}-{REPORT_DATE.day:0>2}',
            json.dumps(ukraine_map_json),
            json.dumps(sorted(df['Міжнародна непатентована назва'].unique().tolist())),
            
            # —————————————————————————————————— Regional Chart. SECTION 1 ———————————————————————————————————
            # json.dumps(region_df.columns.tolist(), ensure_ascii=False), 
            # json.dumps(region_df.to_dict('list'), ensure_ascii=False), 
            # json.dumps(region_df.index.tolist(), ensure_ascii=False),
            json.dumps(region_with_foundsource_df.to_dict('list'), ensure_ascii=False),
            # —————————————————————————————————— Regional Chart. SECTION 1 ———————————————————————————————————
            # ——————————————————————————————————— Regional HTML. SECTION 2 ———————————————————————————————————
            # Timed out stock reports
            timed_out_reports.to_json(orient='split', force_ascii=False),
            
            # Overall leftovers
            f'{int(region_df.sum().sum()):,}',
            # The most leftovers
            first_region if (first_region := region_df.index[region_df.sum(axis=1).argmax()]) != "Україна" else "НацСклади",
            f'{int(region_df.sum(axis=1).max()):,}',
            # The least leftovers
            last_region if (last_region := region_df.index[region_df.sum(axis=1).argmin()]) != "Україна" else "НацСклади",
            f'{int(region_df.sum(axis=1).min()):,}',
            
            # Top-3 vaccines left
            vaccines_left_sorted.iloc[0].name,
            f'{int(vaccines_left_sorted.iloc[0][0]):,}',
            vaccines_left_sorted.iloc[1].name,
            f'{int(vaccines_left_sorted.iloc[1][0]):,}',
            vaccines_left_sorted.iloc[2].name,
            f'{int(vaccines_left_sorted.iloc[2][0]):,}',
            
            # Top-3 vaccines absent
            vaccines_left_sorted.iloc[-1].name,
            f'{int(vaccines_left_sorted.iloc[-1][0]):,}',
            vaccines_left_sorted.iloc[-2].name,
            f'{int(vaccines_left_sorted.iloc[-2][0]):,}',
            vaccines_left_sorted.iloc[-3].name,
            f'{int(vaccines_left_sorted.iloc[-3][0]):,}',
            # ——————————————————————————————————— Regional HTML. SECTION 2 ———————————————————————————————————
            
            # ———————————————————————————————— Institutional Chart. SECTION 3 ————————————————————————————————
            institutional_level_data_df.to_json(orient='records', force_ascii=False),
            # ———————————————————————————————— Institutional Chart. SECTION 3 ————————————————————————————————
            
            # ——————————————————————————— SECTION 5. Leftovers+Usages+Expirations ————————————————————————————
            json.dumps({region: frame.drop_duplicates() for region, frame in waning_expiration_based_timelines.items()}, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            json.dumps(vaccines_expected_to_expire, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            json.dumps(expiration_timelines, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            average_usage.to_json(orient='index', force_ascii=False),
            json.dumps(date_based_pivot_usage, ensure_ascii=False),
            mean_trends.to_json(orient='index', force_ascii=False),
            json.dumps(future_supplies_export),
            json.dumps(no_future_supplies_usage_based_expiration_timelines_for_ukraine, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            # ——————————————————————————— SECTION 5. Leftovers+Usages+Expirations ————————————————————————————
            
            # ——————————————————————————————————————— Main App Section ———————————————————————————————————————
            json.dumps(usage_based_expiration_timelines, default=lambda obj: pd.DataFrame.to_json(obj, orient='split', force_ascii=False)),
            # ——————————————————————————————————————— Main App Section ———————————————————————————————————————

        ), 
        
        file=open(destination_filepath, 'w')
    )