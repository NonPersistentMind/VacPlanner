import React from 'react';
import {IntlContext} from 'react-intl';

import {
    vaccineColors, 
    namedVaccineColors,
    monthMapping, 
    globalOption,
} from '@js-root/config.js';

import {
    clg, 
    exportToXLSX, 
    prepareJSONedDataFrame,
    monthInterval,
    reverseMapping,
    regionPositions
} from '@js-root/misc.js';

export default function NationalStockChartComponent({nationalStock, selectedFilters, addNewChart}) {
    const intl = React.useContext(IntlContext);
    const chartCompontent = React.useRef(null);
    const chartInstance = React.useRef(null);
    const storagePlaces = {};

    nationalStock['Міжнародна непатентована назва'].forEach((el, i) => {
        // Create a dictionary of the form { 'Вакцина': { 'Місце зберігання': 'Кількість доз' } }
        !storagePlaces[el] && (storagePlaces[el] = {});
        !storagePlaces[el][nationalStock['Місце зберігання'][i]] && (storagePlaces[el][nationalStock['Місце зберігання'][i]] = 0);
        storagePlaces[el][nationalStock['Місце зберігання'][i]] += nationalStock['Кількість доз'][i];
    });

    // Initial setup
    React.useEffect(() => {
        if (!chartCompontent.current) return;
        chartInstance.current = echarts.init(chartCompontent.current);
        const chart = chartInstance.current;

        let option = Object.assign({}, globalOption);
        Object.assign(option, {
            darkMode: true,
            color: vaccineColors.map(el => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
                offset: 0,
                color: el+'bb'
            }, 
            {
                offset: 0.5,
                color: el
            }, 
            {
                offset: 1,
                color: el+'bb'
            }])),

            title: {
                left: '15px',
                top: '20px',
                textStyle: {
                    fontSize: "1.4rem",
                    color: '#ccc'
                },
            },

            yAxis: {
                type: 'category',
                // data: this.state.regions.map(el => el == 'Україна' ? "НацЗалишки" : el),
                axisLabel: {
                    interval: 0,
                    rotate: 90,
                    textStyle: {
                        fontFamily: globalOption.textStyle.fontFamily,
                        fontSize: "12px",
                    }
                }
            },

            xAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: "rgba(255, 255, 255, 0.3)"
                    }
                },
                axisLabel: {
                    interval: '20%',
                    rotate: 30,
                    textStyle: {
                        fontFamily: globalOption.textStyle.fontFamily,
                        fontSize: "12px",
                    }
                }
            },

            textStyle: {
                // fontFamily: 'Georgia',
                color: '#ccc'
            },

            tooltip: {
                trigger: 'item',
                backgroundColor: "rgba(27, 27, 38, 0.933)",
                textStyle: {
                    fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
                    color: '#ccc',
                    fontSize: 14
                },
                axisPointer: {
                    type: 'shadow'
                }
            },

            grid: {
                left: '25px',
                right: '30px',
                top: '200px',
                bottom: '75px',
            },

        });

        chart.setOption(option);
        addNewChart(chart);


        return () => {
            chart.dispose();
        }
    }, []);


    // Update chart data
    React.useEffect(() => {
        const nationalStockTranslation = intl.formatMessage({id:"direct-translation.НацСклади", defaultMessage:"НацСклади"});
        const chart = chartInstance.current;
        
        if (!chart) return;

        let selectedFundSources = selectedFilters['Джерело фінансування'];
        selectedFundSources = Object.keys(selectedFundSources).filter(el => selectedFundSources[el]);
        
        // regionalStock is a dictionary of the form { 'Регіон': .., 'Джерело фінансування': .., 'Міжнародна непатентована назва': .. , 'Кількість': .. }
        let data = nationalStock['Регіон'].reduce((acc, region, i) => {
            // Filter out all the data that does not correspond to the selected found sources 
            if (selectedFundSources.includes(nationalStock['Джерело фінансування'][i])) {
                let vaccine = nationalStock['Міжнародна непатентована назва'][i];
                if (!acc[region]) {
                    acc[region] = {
                        [vaccine]: nationalStock['Кількість доз'][i]
                    };
                }
                else {
                    if (acc[region][vaccine]) {
                        acc[region][vaccine] += nationalStock['Кількість доз'][i];
                    }
                    else {
                        acc[region][vaccine] = nationalStock['Кількість доз'][i];
                    }
                }
            }
            return acc;
        }, {});

        // Get all available vaccine names
        let vaccines_raw = Object.keys(data).reduce((acc, region) => {
            return new Set([...acc, ...Object.keys(data[region])]);
        }, new Set());
        // Sort them alphabetically
        vaccines_raw = Array.from(vaccines_raw).sort((a, b) => a.localeCompare(b));
        // Translate them
        let vaccines = vaccines_raw.map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el}));

        let showLegend = true;
        const title = nationalStockTranslation;

        chart.setOption({
            title: {
                text: title,
            },
            yAxis: {
                data: vaccines_raw,
                axisLabel: {
                    formatter: (value, index) => {
                        return intl.formatMessage({id:`direct-translation.${value}`, defaultMessage:value});
                    },
                }
            },
            tooltip: {
                formatter: (params) => {
                    const amount = params.value;
                    const vaccine = intl.formatMessage({id:`direct-translation.${params.name}`, defaultMessage:params.name});
                    let tooltip = `<div class="is-flex is-justify-content-space-between my-1">
                    <span class="mr-5">
                        <svg height="10" width="10">
                            <circle cx="5" cy="5" r="5" fill="${params.color.colorStops[1].color}"/>
                        </svg>
                        <b>${vaccine}</b>
                    </span> 
                    <b>${amount}</b>
                    </div>`;
                    Object.keys(storagePlaces[params.name]).forEach((place) => {
                        tooltip += `<div class="is-flex is-justify-content-space-between my-1">
                        <span class="mr-5">
                            <b>${place}</b> 📦
                        </span> 
                        <b>${storagePlaces[params.name][place]}</b>
                        </div>`;
                    });
                    return tooltip;
                }
            },

            series: [
                {
                    type: 'bar',
                    data: vaccines_raw.map((el) => data['Україна'][el]),
                    itemStyle: {
                        color: (params) => {
                            return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                {
                                    offset: 0,
                                    color: namedVaccineColors[params.name] + 'bb'
                                }, 
                                {
                                    offset: 0.42,
                                    color: namedVaccineColors[params.name] 
                                }, 
                                {
                                    offset: 0.57,
                                    color: namedVaccineColors[params.name] 
                                }, 
                                {
                                    offset: 1,
                                    color: namedVaccineColors[params.name] + 'bb'
                                }]);
                        },
                        borderRadius: 6,
                    }

                }
            ],
        });

    }, [nationalStock, selectedFilters]);

    return (
        <div ref={chartCompontent} className="chart height-100" id="section-1-national-stock-chart"></div>
    );
}