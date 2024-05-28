from pathlib import Path
import datetime as dt, logging, sys

SPECIFIC_VACCINE_SHORTCUTS_FILE = None # None for default filesource. Path string if you want to use a specific file source

# None for default filesource. Path string if you want to use a specific file source
SPECIFIC_DATASOURCE = "https://docs.google.com/spreadsheets/d/1koUddJooo_5mQAssJKISCSXJGEIhIxfrWGRpzwYIZ1o/edit#gid=1511936617" 
# SPECIFIC_DATASOURCE = "MedData" 

# None for default filesource. Path string if you want to use a specific file source
SPECIFIC_NATIONAL_STOCK_FILE = 'https://docs.google.com/spreadsheets/d/1SHkdgBo4KEdVYnG3IYzQDIwwK3CnaCVZf8KZ6JFa5t4/edit#gid=0' 
# SPECIFIC_NATIONAL_STOCK_FILE = 'MedData'

RESULTS_FOLDER = Path('./Results/')
DATA_FOLDER = Path('./Data/')
SOURCE_FOLDER = Path('./SourceFiles/')
LOGGING_FOLDER = Path('./Logs/')
warnings_file = LOGGING_FOLDER / 'warnings.log'
logging_file = LOGGING_FOLDER / 'Main.log'

TESTING = False # If True, the program will run additional code for testing
SKIP_FUTURE_SUPPLIES = False # If False, future supplies will be set to 0 and skipped
VACCINES_SKIPPED = ['Правець', 'ДПКГП', 'ГепВ-Дор']
CHECKUP_REQUIRED = False # Set to True if you want the program to output the data it computes during worktime and save it into .xlsx files for manual checkup

DEFAULT_SHELF_LIFE = dt.timedelta(days=365 * 2) # Default shelf life for vaccines (2 years now). Used for to predict expiration dates of future supplies

LOGGING_LEVEL = logging.DEBUG