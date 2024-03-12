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

        let vaccines_raw = Object.keys(data).reduce((acc, region) => {
            return new Set([...acc, ...Object.keys(data[region])]);
        }, new Set());
        vaccines_raw = Array.from(vaccines_raw).sort((a, b) => a.localeCompare(b));
        let vaccines = vaccines_raw.map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el}));

        // let regions_raw = Object.keys(data).sort((a, b) => regionPositions[a] - regionPositions[b]);
        // let regions = regions_raw.map(el => el == 'Україна' ? nationalStock : intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el}));

        // let series = [];
        // for (let el of vaccines) {
        //     series.push({
        //         name: el,
        //         type: 'bar',
        //         stack: 'total',
        //         barWidth: '70%',
        //         label: {
        //             show: true,
        //             textStyle:{
        //                 fontFamily: 'Georgia',
        //                 color: 'hsl(0, 0%, 4%)'
        //             }
        //         },
        //         itemStyle: {
        //             borderRadius: 4,
        //             // borderColor: '#fff',
        //             borderWidth: 2
        //         },
        //         emphasis: {
        //             focus: 'series'
        //         },
        //         data: Object.values(data).map(regionalVaccines => regionalVaccines[el] || 0)
        //     });
        // }

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
                    let value = params.value;
                    let name = intl.formatMessage({id:`direct-translation.${params.name}`, defaultMessage:params.name});
                    return `<div class="is-flex is-justify-content-space-between my-1">
                    <span class="mr-3">
                        <svg height="10" width="10">
                            <circle cx="5" cy="5" r="5" fill="${params.color.colorStops[1].color}"/>
                        </svg>
                        ${name}
                    </span> 
                    <b>${value}</b>
                    </div>`;
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

            // toolbox: {
            //     show: true,
            //     top: 50,
            //     right: 25,
            //     feature: {
            //         saveAsImage: {
            //             show: true,
            //             backgroundColor: 'auto'
            //         },
            //         myRestore: {
            //             show: true,
            //             title: intl.formatMessage({id:'direct-translation.RESTORE', defaultMessage:'Відновити'}),
            //             icon: "path://M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2",
            //             onclick: function () {
            //                 chart.setOption({
            //                     legend: {
            //                         selected: vaccines.reduce((acc, item) => {
            //                             acc[item] = true;
            //                             return acc;
            //                         }, {}),
            //                     }
            //                 });
            //             }
            //         },
            //         myToggleLegend: {
            //             show: true,
            //             title: intl.formatMessage({id:'direct-translation.SHOW-HIDE-LEGEND', defaultMessage:'Показати/приховати легенду'}),
            //             icon: 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
            //             onclick: function () {
            //                 showLegend = (showLegend) ? false : true;
            //                 chart.setOption({
            //                     legend: { show: showLegend }
            //                 })
            //             }
            //         },
            //         mySaveData: {
            //             show: true,
            //             title: intl.formatMessage({id:'direct-translation.EXPORT-TO-EXCEL', defaultMessage:'Експортувати в Excel'}),
            //             icon: 'path://M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM11 12C10.4477 12 10 12.4477 10 13V17V21C10 21.5523 10.4477 22 11 22H15H21C21.5523 22 22 21.5523 22 21V17V13C22 12.4477 21.5523 12 21 12H15H11ZM12 16V14H14V16H12ZM16 16V14H20V16H16ZM16 20V18H20V20H16ZM14 18V20H12V18H14Z',
            //             onclick: function () {
            //                 let fundSources = selectedFundSources.map(value => value.replaceAll(/[\u0400-\u04FF]+/gi, word => intl.formatMessage({id: `foundsource.${word.toLowerCase()}`, defaultMessage: word})));
            //                 fundSources = fundSources.join(', ');

            //                 const aoa = [[intl.formatMessage({id:'regional.toolbox.data-save.selected-fundsources', defaultMessage:'Обрані джерела фінансування'})+':', fundSources],[]];
            //                 aoa.push([''].concat(regions));
            //                 for (let vacName of vaccines_raw) {
            //                     aoa.push(
            //                         [vacName].concat(regions_raw.map(reg => data[reg][vacName] || 0) ) 
            //                     );
            //                 }
            //                 exportToXLSX(aoa, title+'.xlsx');
            //             }
            //         }
            //     }
            // }
        });

    }, [nationalStock, selectedFilters]);

    return (
        <div ref={chartCompontent} className="chart height-100" id="section-1-national-stock-chart"></div>
    );
}