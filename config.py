from pathlib import Path
import datetime as dt


RESULTS_FOLDER = Path('./Results/')
DATA_FOLDER = Path('./Data/')
SOURCE_FOLDER = Path('./SourceFiles/')

TESTING = True
SKIP_FUTURE_SUPPLIES = True
checkup_required = False

DEFAULT_SHELF_LIFE = dt.timedelta(days=365 * 2)

