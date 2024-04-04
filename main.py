from src import (
    get_data,
    get_latest_file,
    get_usage,
    compute_region_with_foundsource_df, 
    compute_region_df, 
    compute_vaccines_left_sorted,
    compute_timed_outs_report, 
    compute_institutional_data, 
    compute_expiration_timelines, 
    compute_date_based_pivot_usage, 
    compute_pivot_usage,
    compute_usage_trends,
    compute_average_usage, 
    compute_future_supplies,
    compute_future_supplies_export,
    compute_usage_based_expiration_timelines,
    compute_waning_expiration_based_timelines,
    accumulate,
    debug
)
from config import DATA_FOLDER, SPECIFIC_DATASOURCE

if __name__ == '__main__':
    if SPECIFIC_DATASOURCE:
        DATA_FILE = SPECIFIC_DATASOURCE
    else:
        DATA_FILE = get_latest_file(DATA_FOLDER)

    df, REPORT_DATE, timed_outs, national_leftovers = get_data(DATA_FILE)

    region_with_foundsource_df = compute_region_with_foundsource_df(df)

    region_df = compute_region_df(df, REPORT_DATE)

    timed_out_reports = compute_timed_outs_report(timed_outs)

    institutional_level_data_df = compute_institutional_data(df)

    expiration_timelines, PICK_SUPPLIES_MASK = compute_expiration_timelines(df, national_leftovers)
    debug(expiration_timelines['Україна'])
    no_future_supplies_ukrainian_expiration_timelines, _ = compute_expiration_timelines(df, national_leftovers, include_future_supplies=False, specific_regions=['Україна'])
    debug(no_future_supplies_ukrainian_expiration_timelines)
    
    usages = get_usage()
    pivot_usage = compute_pivot_usage(usages, vaccines_tracked=expiration_timelines['Україна'].columns)
    average_usage = compute_average_usage(usages)
    date_based_pivot_usage = compute_date_based_pivot_usage(pivot_usage, REPORT_DATE)
    
    waning_expiration_based_timelines = compute_waning_expiration_based_timelines(df, expiration_timelines, REPORT_DATE, PICK_SUPPLIES_MASK)
    debug(waning_expiration_based_timelines['Україна'])
    no_future_supplies_ukrainian_waning_expiration_based_timelines = compute_waning_expiration_based_timelines(df, no_future_supplies_ukrainian_expiration_timelines, REPORT_DATE, PICK_SUPPLIES_MASK, specific_regions=['Україна'], include_future_supplies=False)
    debug(no_future_supplies_ukrainian_waning_expiration_based_timelines)

    usage_based_expiration_timelines, vaccines_expected_to_expire, ukraine_based_expiration = compute_usage_based_expiration_timelines(
        df,
        waning_expiration_based_timelines,
        average_usage,
        expiration_timelines,
        REPORT_DATE,
        PICK_SUPPLIES_MASK,
    )
    no_future_supplies_usage_based_expiration_timelines, _, _ = compute_usage_based_expiration_timelines(
        df,
        no_future_supplies_ukrainian_waning_expiration_based_timelines,
        average_usage,
        no_future_supplies_ukrainian_expiration_timelines,
        REPORT_DATE,
        PICK_SUPPLIES_MASK,
        specific_regions=['Україна'],
    )
    debug(no_future_supplies_usage_based_expiration_timelines)
    
    print("".center(100, "-"))
    print("Potential waste if treating Ukraine as a whole:\n")
    print(ukraine_based_expiration)
    print("".center(100, "-"))

    mean_trends = compute_usage_trends(pivot_usage, REPORT_DATE)
    
    
    # accumulate(
    #     REPORT_DATE,
    #     df,
    #     region_with_foundsource_df,
    #     timed_out_reports,
    #     region_df,
    #     compute_vaccines_left_sorted(region_df),
    #     institutional_level_data_df,
    #     average_usage,
    #     mean_trends, 
    #     date_based_pivot_usage, 
    #     compute_future_supplies_export(compute_future_supplies(national_leftovers)),
    #     waning_expiration_based_timelines,
    #     vaccines_expected_to_expire,
    #     expiration_timelines,
    #     usage_based_expiration_timelines,
    # )
    
    