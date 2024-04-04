from pathlib import Path
import datetime as dt, logging, sys

SPECIFIC_DATASOURCE = None # None for default filesource. Path string if you want to use a specific file source
SPECIFIC_VACCINE_SHORTCUTS_FILE = None # None for default filesource. Path string if you want to use a specific file source
SPECIFIC_NATIONAL_STOCK_FILE = None # None for default filesource. Path string if you want to use a specific file source

RESULTS_FOLDER = Path('./Results/')
DATA_FOLDER = Path('./Data/')
SOURCE_FOLDER = Path('./SourceFiles/')
LOGGING_FOLDER = Path('./Logs/')
warnings_file = LOGGING_FOLDER / 'warnings.log'
logging_file = LOGGING_FOLDER / 'Main.log'

TESTING = False # If True, the program will run additional code for testing
SKIP_FUTURE_SUPPLIES = False # If False, future supplies will be set to 0 and skipped
VACCINES_SKIPPED = ['Правець', 'ДПКГП', 'ГепВ-Дор']
CHECKUP_REQUIRED = False # If the program should output the data it computes into .xlsx files for manual checkup

DEFAULT_SHELF_LIFE = dt.timedelta(days=365 * 2) # Default shelf life for vaccines (2 years now). Used for to predict expiration dates of future supplies

LOGGING_LEVEL = logging.DEBUG