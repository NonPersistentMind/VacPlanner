import React, {Component, createContext, useContext} from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga4';
import { IntlProvider, FormattedMessage, IntlContext } from 'react-intl';
import { saveAs } from 'file-saver';

import 'bulma/css/bulma.css'; // For Bulma's CSS
import './style.css'; 

import enMessages from '../translations/en/ui.json';
import ukMessages from '../translations/uk/ui.json';

import {
    clg, 
    exportToXLSX, 
    prepareJSONedDataFrame,
    monthInterval,
    reverseMapping,
    regionPositions
} from './js/misc.js';
import {
    vaccineColors, 
    namedVaccineColors,
    monthMapping, 
    globalOption,
} from './js/config.js';
import MenuComponent from './js/VaccineStock/App/Menu/Menu.js';
import HeadSectionComponent from './js/VaccineStock/HeadSection/Head.js';
import RegionalStockChartComponent from './js/VaccineStock/RegionalSection/RegionalStockChart';
import NationalStockChartComponent from './js/VaccineStock/RegionalSection/NationalStockChart';
import DropdownComponent from './js/VaccineStock/RegionalSection/DropdownBlock/DropdownComponent';

const REPORT_DATE = new Date("/*{}*/");
const ukraineTopoJSON = /*{}*/;
const allVaccines = /*{}*/;

const LanguageContext = createContext();

echarts.registerMap('Ukraine', ukraineTopoJSON);


class RegionalChartSectionComponent extends React.Component {
    static contextType = IntlContext;
    constructor(props) {
        super(props);

        const data = /*{}*/;

        this.state = {
            regionalStockData: data['Регіон'].reduce((acc, region, i) => {
                if (region != 'Україна') {
                    acc['Регіон'].push(region);
                    acc['Міжнародна непатентована назва'].push(data['Міжнародна непатентована назва'][i]);
                    acc['Джерело фінансування'].push(data['Джерело фінансування'][i]);
                    acc['Кількість доз'].push(data['Кількість доз'][i]);
                }
                return acc;
            }, {'Регіон': [], 'Джерело фінансування': [], 'Міжнародна непатентована назва': [], 'Кількість доз': []}),
            nationalStockData: data['Регіон'].reduce((acc, region, i) => {
                if (region == 'Україна') {
                    acc['Регіон'].push(region);
                    acc['Міжнародна непатентована назва'].push(data['Міжнародна непатентована назва'][i]);
                    acc['Джерело фінансування'].push(data['Джерело фінансування'][i]);
                    acc['Кількість доз'].push(data['Кількість доз'][i]);
                }
                return acc;
            }, {'Регіон': [], 'Джерело фінансування': [], 'Міжнародна непатентована назва': [], 'Кількість доз': []}),
        }

        const foundSourceArray = new Array(...new Set(data['Джерело фінансування']));
        this.state["selectedFilters"] = {
            'Джерело фінансування': foundSourceArray.reduce((acc, item) => {
                acc[item] = true;
                return acc;
            }, {})
        };
    }

    handleFilterChange = (filterName, selectedValues) => {
        const selectedFilters = Object.assign({}, this.state.selectedFilters);
        selectedFilters[filterName] = selectedValues;
        this.setState({
            selectedFilters
        });
    }

    render() {
        return (
            <section id="section-1" className="hero is-fullheight">
                <img
                    src="https://www.cam.ac.uk/sites/www.cam.ac.uk/files/styles/content-885x432/public/news/research/news/gettyimages-1501082127-dp.jpg?itok=v8Y6IdpV" />
                <div className="regional-foundsource-filter">
                    <DropdownComponent
                        filterName="Джерело фінансування"
                        filterValues={this.state.selectedFilters['Джерело фінансування']}
                        setFilterValue={this.handleFilterChange}
                    />
                </div>
                {/* <div className="chart" id="section-1-chart"></div> */}
                <div className="tile is-ancestor">
                    {/* Add two full-screen bulma tiles: one takes 9/12 portion of space and another – 3/12*/}
                    <div className="tile is-parent is-9">
                        <div className="tile is-child">
                            <RegionalStockChartComponent regionalStock={this.state.regionalStockData} selectedFilters={this.state.selectedFilters} addNewChart={this.props.addNewChart}/>
                        </div>
                    </div>
                    <div className="tile is-parent is-3">
                        <div className="tile is-child">
                            <NationalStockChartComponent nationalStock={this.state.nationalStockData} selectedFilters={this.state.selectedFilters} addNewChart={this.props.addNewChart}/>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    // componentDidMount() {
    //     let regionalChartHolder = document.getElementById('section-1-chart');
    //     this.chart = echarts.init(regionalChartHolder);
    //     let intl = this.context;
    //     let chart = this.chart;

    //     let option = Object.assign({}, globalOption);
    //     Object.assign(option, {
    //         darkMode: true,
    //         // backgroundColor:'rgba(30, 31, 43, 0.7)',
    //         color: vaccineColors.map(el => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    //         {
    //             offset: 0,
    //             color: el+'bb'
    //         }, 
    //         {
    //             offset: 0.5,
    //             color: el
    //         }, 
    //         {
    //             offset: 1,
    //             color: el+'bb'
    //         }])),

    //         title: {
    //             left: '15px',
    //             top: '20px',
    //             textStyle: {
    //                 // fontFamily: 'Georgia',
    //                 fontSize: "1.4rem",
    //                 color: '#ccc'
    //             },
    //         },

    //         dataZoom: [
    //             {
    //                 type: 'slider',
    //                 yAxisIndex: [0],
    //                 filterMode: 'empty',
    //                 left: 20,
    //                 width: 35,

    //                 textStyle: {
    //                     color: 'rgb(255 255 255 / 75%)'
    //                 },

    //                 borderRadius: 10,
    //                 borderColor: 'white',
    //                 fillerColor: 'rgb(189 208 218 / 75%)',

    //                 handleStyle: {
    //                     borderColor: 'white',
    //                 },

    //                 moveHandleSize: 8,
    //                 moveHandleStyle: {
    //                     color: 'rgb(189 208 218 / 75%)',
    //                     borderColor: 'white',
    //                 },

    //                 emphasis: {
    //                     moveHandleStyle: {
    //                         color: 'rgb(109 205 255 / 100%)',
    //                         borderColor: 'white',
    //                     },
    //                 }
    //             }
    //         ],

    //         xAxis: {
    //             type: 'category',
    //             // data: this.state.regions.map(el => el == 'Україна' ? "НацЗалишки" : el),
    //             axisLabel: {
    //                 interval: 0,
    //                 rotate: 55,
    //                 textStyle: {
    //                     fontFamily: globalOption.textStyle.fontFamily,
    //                     fontSize: "12px",
    //                 }
    //             }
    //         },

    //         yAxis: {
    //             type: 'value',
    //             splitLine: {
    //                 lineStyle: {
    //                     type: 'dashed',
    //                     color: "rgba(255, 255, 255, 0.2)"
    //                 }
    //             },
    //             axisLabel: {
    //                 textStyle: {
    //                     fontFamily: globalOption.textStyle.fontFamily,
    //                     fontSize: "12px",
    //                 }
    //             }
    //         },

    //         textStyle: {
    //             // fontFamily: 'Georgia',
    //             color: '#ccc'
    //         },

    //         tooltip: {
    //             trigger: 'item',
    //             backgroundColor: "rgba(27, 27, 38, 0.933)",
    //             textStyle: {
    //                 fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
    //                 color: '#ccc',
    //                 fontSize: 14
    //             },
    //             axisPointer: {
    //                 type: 'shadow'
    //             }
    //         },

    //         grid: {
    //             left: '150px',
    //             right: '30px',
    //             top: '100px',
    //             bottom: '110px'
    //         },

    //     });


    //     let lastClickTime = 0;
    //     let clickTimeout = null;

    //     this.chart.on('legendselectchanged', function (params) {
    //         const currentTime = new Date().getTime();
    //         const timeDiff = currentTime - lastClickTime;
        
    //         if (timeDiff < 300) { // If time difference is less than 300ms, consider it as a double click
    //             if (clickTimeout) clearTimeout(clickTimeout); // Clear the previous timeout
        
    //             Object.keys(params.selected).forEach(name => {
    //                 if (params.selected[name]) {
    //                     chart.dispatchAction({
    //                         type: 'legendUnSelect',
    //                         name: name
    //                     });
    //                 }
    //             });

    //             chart.dispatchAction({
    //                 type: 'legendSelect',
    //                 name: params.name
    //             });


    //             // chart.setOption({});
        
    //         } else { // If it's not a double click, start a timeout
    //             clickTimeout = setTimeout(function() {
    //                 // Add your single click functionality here
    //             }, 150);
    //         }
        
    //         lastClickTime = currentTime;
    //     });

    //     this.chart.setOption(option);
    //     this.props.addNewChart(this.chart);
    // }

    // componentDidUpdate() {
    //     const chart = this.chart;
    //     const intl = this.context;
    //     const nationalStock = intl.formatMessage({id:"direct-translation.НацСклади", defaultMessage:"НацСклади"});
        
    //     let selectedFundSources = this.state.selectedFilters['Джерело фінансування'];
    //     selectedFundSources = Object.keys(selectedFundSources).filter(el => selectedFundSources[el]);
        
    //     // data is a dictionary of the form { 'Регіон': .., 'Джерело фінансування': .., 'Міжнародна непатентована назва': .. , 'Кількість': .. }
    //     let data = this.state.data['Регіон'].reduce((acc, item, i) => {
    //         // Filter out all the data that does not correspond to the selected found sources 
    //         if (selectedFundSources.includes(this.state.data['Джерело фінансування'][i])) {
    //             let vaccine = this.state.data['Міжнародна непатентована назва'][i];
    //             vaccine = intl.formatMessage({id:`direct-translation.${vaccine}`, defaultMessage:vaccine});
    //             if (!acc[item]) {
    //                 acc[item] = {
    //                     [vaccine]: this.state.data['Кількість доз'][i]
    //                 };
    //             }
    //             else {
    //                 if (acc[item][vaccine]) {
    //                     acc[item][vaccine] += this.state.data['Кількість доз'][i]
    //                 }
    //                 else {
    //                     acc[item][vaccine] = this.state.data['Кількість доз'][i]
    //                 }
    //             }
    //         }
    //         return acc;
    //     }, {});

    //     let vaccines_raw = Object.keys(data).reduce((acc, region) => {
    //         return new Set([...acc, ...Object.keys(data[region])]);
    //     }, new Set());
    //     vaccines_raw = Array.from(vaccines_raw);
    //     let vaccines = vaccines_raw.map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el}));

    //     let regions_raw = Object.keys(data).sort((a, b) => regionPositions[a] - regionPositions[b]);
    //     let regions = regions_raw.map(el => el == 'Україна' ? nationalStock : intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el}));

    //     let series = [];
    //     for (let el of vaccines) {
    //         series.push({
    //             name: el,
    //             type: 'bar',
    //             stack: 'total',
    //             barWidth: '70%',
    //             label: {
    //                 show: true,
    //                 textStyle:{
    //                     fontFamily: 'Georgia',
    //                     color: 'hsl(0, 0%, 4%)'
    //                 }
    //             },
    //             itemStyle: {
    //                 borderRadius: 4,
    //                 // borderColor: '#fff',
    //                 borderWidth: 2
    //             },
    //             emphasis: {
    //                 focus: 'series'
    //             },
    //             data: Object.values(data).map(regionalVaccines => regionalVaccines[el] || 0)
    //         });
    //     }

    //     let showLegend = true;
    //     const title = intl.formatMessage({id:"regional.chart.title", defaultMessage:"Залишки вакцин"});

    //     this.chart.setOption({
    //         title: {
    //             text: title,
    //         },
    //         legend: {
    //             type: 'plain',
    //             left: "center",
    //             top: "55px",
    //             selectedMode: 'multiple',
    //             selected: vaccines.reduce((acc, item) => {
    //                 acc[item] = true;
    //                 return acc;
    //             }, {}),
    //             textStyle: {
    //                 fontSize: "15px",
    //                 color: '#ccc'
    //             }
    //         },
    //         xAxis: {
    //             type: 'category',
    //             data: regions,
    //             axisLabel: {
    //                 interval: 0,
    //                 rotate: 55,
    //                 textStyle: {
    //                     fontFamily: globalOption.textStyle.fontFamily,
    //                     fontSize: "12px",
    //                 }
    //             }
    //         },
    //         series,

    //         toolbox: {
    //             show: true,
    //             top: 15,
    //             right: 25,
    //             feature: {
    //                 saveAsImage: {
    //                     show: true,
    //                     backgroundColor: 'auto'
    //                 },
    //                 myRestore: {
    //                     show: true,
    //                     title: intl.formatMessage({id:'direct-translation.RESTORE', defaultMessage:'Відновити'}),
    //                     // An icon that looks like we are restoring the chart
    //                     icon: "path://M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2",
    //                     onclick: function () {
    //                         chart.setOption({
    //                             legend: {
    //                                 selected: vaccines.reduce((acc, item) => {
    //                                     acc[item] = true;
    //                                     return acc;
    //                                 }, {}),
    //                             }
    //                         });
    //                     }
    //                 },
    //                 myToggleLegend: {
    //                     show: true,
    //                     title: intl.formatMessage({id:'direct-translation.SHOW-HIDE-LEGEND', defaultMessage:'Показати/приховати легенду'}),
    //                     icon: 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
    //                     onclick: function () {
    //                         showLegend = (showLegend) ? false : true;
    //                         chart.setOption({
    //                             legend: { show: showLegend }
    //                         })
    //                     }
    //                 },
    //                 mySaveData: {
    //                     show: true,
    //                     title: intl.formatMessage({id:'direct-translation.EXPORT-TO-EXCEL', defaultMessage:'Експортувати в Excel'}),
    //                     icon: 'path://M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM11 12C10.4477 12 10 12.4477 10 13V17V21C10 21.5523 10.4477 22 11 22H15H21C21.5523 22 22 21.5523 22 21V17V13C22 12.4477 21.5523 12 21 12H15H11ZM12 16V14H14V16H12ZM16 16V14H20V16H16ZM16 20V18H20V20H16ZM14 18V20H12V18H14Z',
    //                     onclick: function () {
    //                         console.log(selectedFundSources);
    //                         let fundSources = selectedFundSources.map(value => value.replaceAll(/[\u0400-\u04FF]+/gi, word => intl.formatMessage({id: `foundsource.${word.toLowerCase()}`, defaultMessage: word})));
    //                         console.log(fundSources);
    //                         fundSources = fundSources.join(', ');

    //                         const aoa = [[intl.formatMessage({id:'regional.toolbox.data-save.selected-fundsources', defaultMessage:'Обрані джерела фінансування'})+':', fundSources],[]];
    //                         aoa.push([''].concat(regions));
    //                         for (let vacName of vaccines_raw) {
    //                             aoa.push(
    //                                 [vacName].concat( regions_raw.map(reg => data[reg][vacName] || 0) ) 
    //                             );
    //                         }
    //                         exportToXLSX(aoa, title+'.xlsx');
    //                     }
    //                 }
    //             }
    //         }
    //     }, {replaceMerge: ['series', 'toolbox']});
    // }
}

class RegionalTextSectionComponent extends React.Component {
    static contextType = IntlContext;

    constructor(props) {
        super(props);

        let data = Object.keys(this.props.dataWithUsage).map(region => {
            if (region === 'Україна'){
                return null;
            }

            let regionalData = this.props.dataWithUsage[region];

            // Find all vaccines with coverage less than 3 months
            let insufficientVaccines = regionalData.columns.filter((vaccine,i) => {
                let vaccineEndsIndex = regionalData.data[i].findIndex(el => el == 0);
                let vaccineEndsDate = new Date(regionalData.index[vaccineEndsIndex]);
                let coverageInMonth = monthInterval(REPORT_DATE, vaccineEndsDate);
                return coverageInMonth < 3;
            });
            if (insufficientVaccines) {
                return {
                    region,
                    insufficientVaccines,
                }
            }
            else {
                return null;
            }
        });

        data = reverseMapping(data);

        this.state = {
            data: data,
            timed_out_reports: /*{}*/,
        }
    }

    exportScarceVaccines = () => {
        const intl = this.context;
        const data = this.state.data;
        const aoa = [[intl.formatMessage({id:'direct-translation.VACCINE', defaultMessage:'Вакцина'}), intl.formatMessage({id:'direct-translation.REGIONS', defaultMessage:'Регіони'})]];
        for (let item of data) {
            aoa.push([intl.formatMessage({id: `direct-translation.${item.vaccine}`}), item.regions.join(', ')]);
        }
        exportToXLSX(aoa, intl.formatMessage({id: "regional.text.scarce-vaccines", defaultMessage: "Дефіцитні вакцини"}) + '.xlsx');
    }

    exportTimedOutReports = () => {
        clg(this.state.timed_out_reports);
        const intl = this.context;
        const data = this.state.timed_out_reports;
        const aoa = [[intl.formatMessage({id:'direct-translation.REGION', defaultMessage:'Регіон'}), intl.formatMessage({id:'direct-translation.AMOUNT', defaultMessage:'Кількість'}), intl.formatMessage({id:'direct-translation.FACILITIES', defaultMessage:'Заклади'})]];
        data.index.forEach((el, i) => {
            aoa.push([intl.formatMessage({id: `direct-translation.${el}`}), data.data[i][0].toLocaleString(), data.data[i][1].join('\n\n')]);
        });
        exportToXLSX(aoa, intl.formatMessage({id: "regional.text.late-reported-leftovers", defaultMessage: "Залишки, прозвітовані більше, ніж 7 днів тому"}) + '.xlsx');
    }

    render() {
        const intl = this.context;
        const localized_TOP = intl.formatMessage({id: 'direct-translation.TOP', defaultMessage: 'Топ'});
        
        let data = this.state.data;

        return (
            <section id="section-2" className="hero is-fullheight">
                <div className="background">
                    <div className="top"></div>
                    <div className="bottom"></div>
                </div>
                <nav className="level has-text-light is-mobile pt-5 mt-5">
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="title is-4 has-text-light">
                                <FormattedMessage id="regional.text.regional" defaultMessage="Регіональна"/>
                                <br/>
                                <FormattedMessage id="regional.text.info" defaultMessage="Інформація"/>:
                            </p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading"><FormattedMessage id="regional.text.overall-leftovers" defaultMessage="Загальна кількість залишків"/></p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading"><FormattedMessage id="regional.text.most-leftovers-region" defaultMessage="Найбільша кількість залишків"/></p>
                            <p className="title has-text-light">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading"><FormattedMessage id="regional.text.least-leftovers-region" defaultMessage="Найменша кількість залишків"/></p>
                            <p className="title has-text-light">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                </nav>
                <nav className="level has-text-light is-mobile">
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="title is-4 has-text-light">
                                <FormattedMessage id="regional.text.top" defaultMessage="Топ"/>
                                <br/>
                                <FormattedMessage id="regional.text.of-available-vaccines" defaultMessage="Наявних Вакцин"/>
                            </p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading is-3 has-text-light mb-4"><b>{localized_TOP}-1</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading is-3 has-text-light mb-4"><b>{localized_TOP}-2</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading is-2 has-text-light mb-4"><b>{localized_TOP}-3</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                </nav>
                <nav className="level has-text-light is-mobile">
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="title is-4 has-text-light">
                                <FormattedMessage id="regional.text.top" defaultMessage="Топ"/>
                                <br/>
                                <FormattedMessage id="regional.text.of-absent-vaccines" defaultMessage="Відсутніх Вакцин"/>
                            </p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading mb-4"><b>{localized_TOP}-1</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading mb-4"><b>{localized_TOP}-2</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="heading mb-4"><b>{localized_TOP}-3</b></p>
                            <p className="title is-5 has-text-light mb-2">{intl.formatMessage({id:"direct-translation./*{}*/"})}</p>
                            <p className="title has-text-light">/*{}*/</p>
                        </div>
                    </div>
                </nav>
                <nav className="level is-justify-content-center has-text-light is-mobile">
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="title is-3 has-text-light">
                                <FormattedMessage id="regional.text.other" defaultMessage="Інше"/>:
                            </p>
                        </div>
                    </div>
                </nav>
                <nav className="level is-justify-content-center has-text-light is-mobile mb-5 pb-5">
                    <div className="level-item has-text-centered">
                        <div>
                            <p className="title is-5 has-text-light mb-3 is-clickable" onClick={this.exportTimedOutReports}><FormattedMessage id="regional.text.late-reported-leftovers" defaultMessage="Залишки, прозвітовані більше, ніж 7 днів тому"/></p>
                            {
                                this.state.timed_out_reports.index.map((el, i) => {
                                    return (
                                        <p key={i} className="heading is-6 has-text-light mb-2">
                                            {intl.formatMessage({id: `direct-translation.${el}`, defaultMessage: el})} – {this.state.timed_out_reports.data[i][0].toLocaleString()} ({this.state.timed_out_reports.data[i][1].length} {intl.formatMessage({id: `direct-translation.FACILITIES`, defaultMessage: 'закладів'})})
                                        </p>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <div className="level-item full-width">
                        <div className="columns is-multiline is-centered">
                            <div className="column is-full has-text-centered">
                                <p className="title is-4 has-text-light is-clickable" onClick={this.exportScarceVaccines}>
                                    <FormattedMessage id="regional.text.scarce-vaccines" defaultMessage="Дефіцитні вакцини"/>:
                                </p>
                            </div>
                            {
                                data.map((item, i) => {
                                    return (
                                        <div key={i} className="column is-4 has-text-centered">
                                            <div>
                                                <p className="title is-5 has-text-light mb-5">{intl.formatMessage({id: `direct-translation.${item.vaccine}`})}</p>
                                                <p className="heading is-5 has-text-light">{
                                                    item.regions.length < 6 ? 
                                                    item.regions.map(el=> intl.formatMessage({id: `direct-translation.${el}`})).join(', ') : 
                                                    (
                                                        item.regions.slice(0, 5).map(el=> intl.formatMessage({id: `direct-translation.${el}`})).join(', ') + 
                                                        `... (${intl.formatMessage({id: "direct-translation.OVERALL", defaultMessage: "Усього"})} – ${item.regions.length})`
                                                    )
                                                }</p>
                                            </div>
                                        </div>)
                                    })
                                }
                        </div>
                    </div>
                </nav>

            </section>
        );
    }
}


class InstitutionalComponent extends React.Component {
    static contextType = IntlContext;

    state = {
        defaultData: /*{}*/,
        data: null,
    }

    translateData = (data) => {
        const intl = this.context;
        return data.map(el => {
            return {
                Name: intl.formatMessage({id: `direct-translation.${el.Name}`, defaultMessage: el.Name}),
                Rgn: intl.formatMessage({id: `direct-translation.${el.Rgn}`, defaultMessage: el.Rgn}),
                Fclt: intl.formatMessage({id: `direct-translation.${el.Fclt}`, defaultMessage: el.Fclt}),
                Amnt: el.Amnt,
            }
        });
    }


    createTreeFromData = (data) => {
        // From the data of the form:
        // [{Name, Rgn, Fclt, Amnt}, ...]
        // Create a tree-like structure of the form 
        // {Name, children -> {Rgn, hidden_children -> {Fclt, Amnt}}}
        const tree = data.reduce((acc, item) => {
            let vaccine = acc.find(el => el.name === item.Name);
            if (!vaccine) {
                vaccine = { name: item.Name, id: item.Name, children: []};
                acc.push(vaccine);
            }
            let region = vaccine.children.find(el => el.name === item.Rgn);
            if (!region) {
                region = { name: item.Rgn, id: item.Name + '_' + item.Rgn, hidden_children: [] };
                vaccine.children.push(region);
            }
            region.hidden_children.push({ name: item.Fclt, id: item.Fclt, value: item.Amnt });

            return acc;
        }, []);

        tree.forEach(vaccine => {
            vaccine.children.forEach(region => {
                region.value = region.hidden_children.reduce((acc, item) => acc + item.value, 0);
            });
        });

        return tree
    }

    render() {
        return this.state.data ? (
            <div id="institutional-section">
                {/*<img src="https://i.ibb.co/7z2FPgV/112768-red-and-black-blurred-background-vector-2.jpg" alt=""/>*/}
                <div className="gradient-background"></div>

                <InstitutionalChartSectionComponent 
                    data={this.state.data} 
                    language={this.props.language} 
                    addNewChart={this.props.addNewChart} 
                    createTreeFromData={this.createTreeFromData}
                    colorOrder={this.colorOrderArray}
                />
                
                <InstitutionalTextSectionComponent 
                    data={this.state.data} 
                    language={this.props.language} 
                    createTreeFromData={this.createTreeFromData}
                />
            </div>
        ) : null;
    }

    componentDidMount() {
        this.colorOrderArray = this.state.defaultData.reduce((acc, item) => {
            (!acc[item.Name]) && (acc[item.Name] = 0);
            acc[item.Name] += item.Amnt;
            return acc;
        }, {});
        this.colorOrderArray = Object.entries(this.colorOrderArray).sort((a, b) => b[1] - a[1]).map(el => el[0]);
        this.setState({
            data: this.translateData(this.state.defaultData),
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.language != this.props.language) {
            this.setState({
                data: this.translateData(this.state.defaultData)
            });
        }
    }
}

class InstitutionalChartSectionComponent extends React.Component {
    static contextType = IntlContext;

    state = {
        vaccinePicked: null,
    }

    exportToExcel = () => {
        const intl = this.context;
        const data = this.props.data;

        // const aoa = [['Вакцина', 'Регіон', 'Заклад', 'Кількість']];
        const aoa = [[intl.formatMessage({id: "direct-translation.VACCINE", defaultMessage: "Вакцина"}), intl.formatMessage({id: "direct-translation.REGION", defaultMessage: "Регіон"}), intl.formatMessage({id: "direct-translation.FACILITY", defaultMessage: "Заклад"}), intl.formatMessage({id: "direct-translation.AMOUNT", defaultMessage: "Кількість"})]];
        data.forEach( map_of_values => {
            aoa.push([map_of_values.Name, map_of_values.Rgn, map_of_values.Fclt, map_of_values.Amnt]);
        });
        exportToXLSX(aoa, intl.formatMessage({id: "institutional.chart-section.chart-title", defaultMessage: "Залишки вакцин у закладах"}) + '.xlsx');
    }

    handleSearch = (value) => {
        let dataFound = this.props.data.filter(el => el.Rgn.toLowerCase().includes(value.toLowerCase()));
        if (dataFound.length > 0) {
            this.chart.setOption({
                series: {
                    data: this.props.createTreeFromData(dataFound)
                }
            });
        }
        else {
            dataFound = this.props.data.filter(el => el.Fclt.toLowerCase().includes(value.toLowerCase()));
            if (dataFound.length > 0) {
                this.chart.setOption({
                    series: {
                        data: this.props.createTreeFromData(dataFound)
                    }
                });
            }
            else {
                this.chart.setOption({
                    series: {
                        data: this.props.createTreeFromData(this.props.data)
                    }
                });
            }
        }
    }

    render() {
        return (
            <section id="section-3" className="hero is-fullheight">

                <div id="chart-container">
                    <div id="vaccine-name-holder" className={this.state.vaccinePicked ? "" : "hidden"}>
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier"> 
                                <path fill="#34495E" d="M50 0c27.613 0 50 22.386 50 50s-22.387 50-50 50C22.386 100 0 77.614 0 50S22.386 0 50 0z"></path> 
                                <defs> 
                                    <circle id="a" cx="50" cy="50" r="50"></circle> 
                                </defs> 
                                <clipPath id="b"> 
                                    <use xlinkHref="#a" overflow="visible"></use> 
                                </clipPath> 
                                <g clipPath="url(#b)"> 
                                    <path fill="#ECF0F1" d="M59 51.213V28H41v23.213C26.592 55.16 16 68.34 16 84c0 18.777 15.222 34 34 34 18.777 0 34-15.223 34-34 0-15.66-10.592-28.84-25-32.787z"></path> 
                                    <path fill="#17A085" d="M73.639 70H26.362A27.857 27.857 0 0 0 22 85c0 15.464 12.536 28 28 28s28-12.536 28-28a27.864 27.864 0 0 0-4.361-15z"></path> 
                                    <path fill="#1ABC9C" d="M32.908 64.205c9.44-4.521 24.744-4.521 34.185 0s9.44 11.852 0 16.372c-9.438 4.521-24.744 4.521-34.185 0-9.439-4.52-9.439-11.85 0-16.372z"></path> 
                                    <path fill="#BDC3C7" d="M41.01 25.744h17.889l.062 8.185-.562.301c-4.688 2.344-12.203 2.344-16.889 0l-.517-.274.017-8.212z"></path> 
                                    <path fill="#ffffff" d="M41.51 23.744c4.687-2.344 12.285-2.344 16.973 0 4.686 2.343 4.686 6.143 0 8.485-4.688 2.344-12.287 2.344-16.973 0-4.686-2.342-4.686-6.142 0-8.485z"></path> 
                                    <path fill="#BDC3C7" d="M45.75 26.581c2.337-.78 6.126-.78 8.464 0 2.336.781 2.336 2.048 0 2.829-2.338.781-6.127.781-8.464 0-2.336-.781-2.336-2.048 0-2.829z"></path> 
                                    <path fill="#5FD0BA" d="M41.5 70a4.5 4.5 0 0 0-4.499 4.486c-.008.388.427.774 1.312 1.07 1.753.586 4.595.586 6.348 0 .874-.291 1.312-.675 1.314-1.058H46A4.5 4.5 0 0 0 41.5 70zM53 66a2.992 2.992 0 0 0-2.999 2.977c-.006.256.284.515.874.709 1.169.39 3.062.39 4.232 0 .582-.192.875-.446.875-.701H56A2.993 2.993 0 0 0 53 66zm8 6a2.993 2.993 0 0 0-2.999 2.975c-.006.258.284.516.874.711 1.169.39 3.062.39 4.232 0 .582-.192.873-.446.875-.701H64A2.993 2.993 0 0 0 61 72z"></path> 
                                    <path fill="#9AA4AE" d="M44 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 .001-4.001A2 2 0 0 1 44 16zm1.5-21a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 9a3.5 3.5 0 1 1-.001-6.999A3.5 3.5 0 0 1 45.5 4zm11 1a5.5 5.5 0 1 0 .001 11.001A5.5 5.5 0 0 0 56.5 5zm0 9a3.5 3.5 0 1 1 3.5-3.5c0 1.934-1.566 3.5-3.5 3.5z"></path> 
                                    <path fill="#17A085" d="M55.107 69.436c-1.17.39-3.063.39-4.232 0-.536-.178-.812-.406-.855-.64l-.019.181c-.006.256.284.515.874.709 1.169.39 3.062.39 4.232 0 .582-.192.875-.446.875-.701H56l-.023-.228c-.018.246-.303.491-.87.679zm-10.446 5.873c-1.753.586-4.595.586-6.348 0-.831-.279-1.25-.639-1.293-1.002l-.019.18c-.008.389.427.775 1.312 1.072 1.753.586 4.595.586 6.348 0 .874-.293 1.312-.676 1.314-1.059H46l-.025-.25c-.003.383-.44.766-1.314 1.059zm18.446.127c-1.17.39-3.063.39-4.232 0-.535-.179-.811-.406-.855-.641l-.019.18c-.006.258.284.516.874.711 1.169.39 3.062.39 4.232 0 .582-.192.873-.446.875-.701H64l-.023-.229c-.017.246-.303.492-.87.68z"></path> 
                                </g> 
                            </g>
                        </svg>
                        <span>{this.state.vaccinePicked}</span>
                    </div>
                    <div className="chart" id="section-3-chart">
                    </div>
                </div>
                
                <div id="search-container">
                    <SearchBarComponent     
                        handleSearch={this.handleSearch}
                    />

                    <article className="message search-result">
                        <div className="message-header is-justify-content-center">
                            <p>Знайшлося! (або ні, ми ще не знаємо)</p>
                        </div>
                        <div className="message-body">
                            <p>Тут Ви знайдете детальну інформацію про область чи заклад, який оберете/знайдете в пошуку.</p>
                            <br/>
                            <p>Ах, так, забув попередити. Знайдете цю інформацію Ви лише тоді, коли я дороблю код, який робить частину активною. Поки – це просто гарненький блок з текстом.
                            <br/> 
                            Але ж не мовчіть, зацініть дизайн!!!</p>
                            <br/>
                            <p>Бережіть себе, чудових свят!</p>
                        </div>
                    </article>
                </div>
            </section>
        );
    }

    componentDidMount() {
        const intl = this.context;
        const tree = this.props.createTreeFromData(this.props.data);
        const vaccineOrder = tree.map(el => {el.name, el._val}).sort((a,b) => b._val - a._val);   
        const instChartHolder = document.getElementById('section-3-chart');
        const chart = echarts.init(instChartHolder, 'roma');
        this.chart = chart;

        let option = Object.assign({}, globalOption);
        option = {
            color: ['#ffffff'].concat(this.props.colorOrder.map(el => namedVaccineColors[el])).map(el => new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                {
                    offset: 0,
                    color: '#313c45'
                },
                {
                    offset: 1,
                    color: el + 'ef'
                }],
                false)),
            title: {
                text: intl.formatMessage({id:"institutional.chart-section.chart-title", defaultMessage:"Залишки вакцин у ЗОЗ"}),
                // backgroundColor: '#1F2632',
                // borderWidth: 1, // border width
                // borderRadius: 10, // border radius for rounded corners
                // padding: 15, // padding
                left: '25px',
                top: '20px',
                textStyle: {
                    fontSize: "1.4rem",
                    lineHeight: 43,
                    color: 'hsl(0, 0%, 96%)'
                },
            },

            textStyle: {
                color: '#ccc'
            },

            tooltip: {
                backgroundColor: "rgba(27, 27, 38, 0.933)",
                textStyle: {
                    fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
                    color: '#ccc',
                    fontSize: 12
                },
            },

            grid: {
                left: '5%',
                right: '2%',
                top: '100px',
                bottom: '150px'
            },

            series: {
                type: 'sunburst',
                emphasis: {
                    focus: 'descendant',
                    blurScope: 'global',
                },
                blur: {
                    itemStyle: {
                        opacity: 0.6
                    }
                },
                levels: [
                    {
                        label: {
                            show: false,
                            color: 'transparent'
                        }
                    }, // Leave the innermost level as default
                    {
                        label: {
                            show: true, // Show labels for the first level
                            rotate: 'radial',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }
                    },
                    {
                        label: {
                            show: true, // Hide labels for the rest levels
                            color: 'transparent',
                            /*
                            rotate: 'tangential',

                            fontFamily: 'Georgia',
                            color: '#EEE',
                            fontSize: 12
                            */
                        }
                    },
                    {
                        label: {
                            show: true, // Hide labels for the rest levels
                            color: 'transparent',

                            /*
                            rotate: 'tangential',

                            fontFamily: 'Georgia',
                            color: '#EEE',
                            fontSize: 14
                            */
                        }
                    },
                    {
                        label: {
                            show: false, // Hide labels for the rest levels
                            /* 
                            rotate: 'radial',

                            fontFamily: 'Georgia',
                            color: '#EEE',
                            fontSize: 14
                            */
                        }
                    }
                ],
                data: tree,
                radius: ['13%', '96%'],
                name: intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"}),
                overflow: "breakAll",
                itemStyle: {
                    // color: c,
                    borderWidth: 2,
                    borderRadius: 5,
                    borderColor: 'rgba(0,0,0, 0.01)',
                    // shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },

            toolbox: {
                show: true,
                top: 15,
                right: 15,
                feature: {
                    saveAsImage: {
                        show: true,
                        backgroundColor: 'auto'
                    },
                    mySaveData: {
                        show: true,
                        title: intl.formatMessage({id:'direct-translation.EXPORT-TO-EXCEL', defaultMessage:'Експортувати в Excel'}),
                        icon: 'path://M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM11 12C10.4477 12 10 12.4477 10 13V17V21C10 21.5523 10.4477 22 11 22H15H21C21.5523 22 22 21.5523 22 21V17V13C22 12.4477 21.5523 12 21 12H15H11ZM12 16V14H14V16H12ZM16 16V14H20V16H16ZM16 20V18H20V20H16ZM14 18V20H12V18H14Z',
                        onclick: this.exportToExcel
                    }
                }
            }
        };

        chart.setOption(option);

        const chartCompontent = this;
        let last_leaf = undefined;
        let prev_element = undefined;
        chart.on('click', function (params) {
            // Clicked on the region
            if (params.data.hidden_children) {
                last_leaf = params.data;
                prev_element = {name: params.data.id.split('_')[0], type: 'vaccine'};
                if (!last_leaf.children) {
                    last_leaf.children = last_leaf.hidden_children;
                }
                chart.setOption({});
                chartCompontent.setState({vaccinePicked: params.treePathInfo.at(-2).name})
                chart.dispatchAction({
                    type: 'sunburstRootToNode',
                    targetNode: params.treePathInfo.at(-2).name + '_' + params.treePathInfo.at(-1).name
                });
            }
            // Clicked on facility
            else if ( !(params.data.children || params.data.hidden_children) ){
                prev_element = {name: last_leaf.id, type: 'region'};
                chart.dispatchAction({
                    type: 'sunburstRootToNode',
                    targetNode: params.treePathInfo.at(-1).name
                });
            }
            // Clicked on vaccine
            else if ( (params.data.children[0].hidden_children) ){
                prev_element = {name: intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"}), type: 'root'};
                chartCompontent.setState({vaccinePicked: params.treePathInfo.at(-1).name})
                chart.dispatchAction({
                    type: 'sunburstRootToNode',
                    targetNode: params.treePathInfo.at(-1).name
                });
            }
            // Clicked on the root
            else {
                (!prev_element || prev_element.type !== 'region') && last_leaf && delete last_leaf.children;
                (!prev_element || prev_element.type == 'root') && chartCompontent.setState({vaccinePicked: null});
                chart.setOption({});
                chart.dispatchAction({
                    type: 'sunburstRootToNode',
                    targetNode: prev_element ? prev_element.name : intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"})
                });

                prev_element = undefined;
            }
        });

        this.props.addNewChart(chart);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.language != this.props.language) {
            const intl = this.context;
            const tree = this.props.createTreeFromData(this.props.data);
            this.chart.setOption({
                title: {
                    text: intl.formatMessage({id:"institutional.chart-section.chart-title", defaultMessage:"Залишки вакцин у ЗОЗ"}),
                },
                series: {
                    type: 'sunburst',
                    emphasis: {
                        focus: 'descendant',
                        blurScope: 'global',
                    },
                    blur: {
                        itemStyle: {
                            opacity: 0.6
                        }
                    },
                    levels: [
                        {
                            label: {
                                show: false,
                                color: 'transparent'
                            }
                        }, // Leave the innermost level as default
                        {
                            label: {
                                show: true, // Show labels for the first level
                                rotate: 'radial',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }
                        },
                        {
                            label: {
                                show: true, // Hide labels for the rest levels
                                color: 'transparent',
                                /*
                                rotate: 'tangential',

                                fontFamily: 'Georgia',
                                color: '#EEE',
                                fontSize: 12
                                */
                            }
                        },
                        {
                            label: {
                                show: true, // Hide labels for the rest levels
                                color: 'transparent',

                                /*
                                rotate: 'tangential',

                                fontFamily: 'Georgia',
                                color: '#EEE',
                                fontSize: 14
                                */
                            }
                        },
                        {
                            label: {
                                show: false, // Hide labels for the rest levels
                                /* 
                                rotate: 'radial',

                                fontFamily: 'Georgia',
                                color: '#EEE',
                                fontSize: 14
                                */
                            }
                        }
                    ],
                    data: tree,
                    radius: ['13%', '96%'],
                    name: intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"}),
                    overflow: "breakAll",
                    itemStyle: {
                        // color: c,
                        borderWidth: 2,
                        borderRadius: 5,
                        borderColor: 'rgba(0,0,0, 0.01)',
                        // shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                toolbox: {
                    show: true,
                    top: 15,
                    right: 15,
                    feature: {
                        saveAsImage: {
                            show: true,
                            backgroundColor: 'auto'
                        },
                        mySaveData: {
                            show: true,
                            title: intl.formatMessage({id:'direct-translation.EXPORT-TO-EXCEL', defaultMessage:'Експортувати в Excel'}),
                            icon: 'path://M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM11 12C10.4477 12 10 12.4477 10 13V17V21C10 21.5523 10.4477 22 11 22H15H21C21.5523 22 22 21.5523 22 21V17V13C22 12.4477 21.5523 12 21 12H15H11ZM12 16V14H14V16H12ZM16 16V14H20V16H16ZM16 20V18H20V20H16ZM14 18V20H12V18H14Z',
                            onclick: this.exportToExcel
                        }
                    }
                }
            });


            const chartCompontent = this;
            const chart = this.chart;
            let last_leaf = undefined;
            let prev_element = undefined;
            chart.on('click', function (params) {
                // Clicked on the region
                if (params.data.hidden_children) {
                    last_leaf = params.data;
                    prev_element = {name: params.data.id.split('_')[0], type: 'vaccine'};
                    if (!last_leaf.children) {
                        last_leaf.children = last_leaf.hidden_children;
                    }
                    chart.setOption({});
                    chartCompontent.setState({vaccinePicked: params.treePathInfo.at(-2).name})
                    chart.dispatchAction({
                        type: 'sunburstRootToNode',
                        targetNode: params.treePathInfo.at(-2).name + '_' + params.treePathInfo.at(-1).name
                    });
                }
                // Clicked on facility
                else if ( !(params.data.children || params.data.hidden_children) ){
                    prev_element = {name: last_leaf.id, type: 'region'};
                    chart.dispatchAction({
                        type: 'sunburstRootToNode',
                        targetNode: params.treePathInfo.at(-1).name
                    });
                }
                // Clicked on vaccine
                else if ( (params.data.children[0].hidden_children) ){
                    prev_element = {name: intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"}), type: 'root'};
                    chartCompontent.setState({vaccinePicked: params.treePathInfo.at(-1).name})
                    chart.dispatchAction({
                        type: 'sunburstRootToNode',
                        targetNode: params.treePathInfo.at(-1).name
                    });
                }
                // Clicked on the root
                else {
                    (!prev_element || prev_element.type !== 'region') && last_leaf && delete last_leaf.children;
                    (!prev_element || prev_element.type == 'root') && chartCompontent.setState({vaccinePicked: null});
                    chart.setOption({});
                    chart.dispatchAction({
                        type: 'sunburstRootToNode',
                        targetNode: prev_element ? prev_element.name : intl.formatMessage({id:"institutional.chart-section.series-name", defaultMessage:"Загальна кількість залишків"})
                    });

                    prev_element = undefined;
                }
            });
        }
    }
}

class SearchBarComponent extends React.Component {
    state = {
        searchValue: '',
        lastSearchedValue: '',
        timerId: null,
    }

    onSearchInput = (e) => {
        // Clear the previous timer if it exists
        if (this.state.timerId) {
            clearTimeout(this.state.timerId);
        }

        // Update the search term in the state
        this.setState({searchValue: event.target.value});

        // Set a new timer to update the state after 0.75 of a second
        let timerId = setTimeout(() => {
            if (e.target.value !== this.state.lastSearchedValue) {
                this.setState({lastSearchedValue: e.target.value});
                // Conduct the actual search here
                this.props.handleSearch(e.target.value);

            }
        }, 500);

        // Save the timer ID in the state so it can be cleared if the user types again
        this.setState({timerId: timerId})
    }

    render() {
        return (
            <div className="form__group field">
                <input type="input" className="form__field" placeholder="Name" name="name" id='name' value={this.state.searchValue} onChange={this.onSearchInput} required />
                <label htmlFor="name" className="form__label"><FormattedMessage id="institutional.chart-section.search-bar.looking-for-something" defaultMessage="Шукаєте щось?"/></label>
            </div>
        );
    }
}

class InstitutionalTextSectionComponent extends React.Component {
    static contextType = IntlContext;
    
    state = {
        selectedRegion: null,
        allRegions: null
    }

    selectRegionHandler = (value) => {
        (value !== this.state.selectedRegion) && this.setState({ selectedRegion: value });
    }

    render() {
        return this.state.allRegions ? (
            <section id="section-4" className="hero is-fullheight">
                <div className="columns is-multiline is-centered is-vcentered is-align-content-space-around has-text-light is-mobile mx-5 my-5">
                    <div className="column is-4 has-text-centered is-flex is-justify-content-center">
                        <div className="column is-10 has-text-centered">
                        <p className="title is-4 has-text-light">
                            <FormattedMessage id="institutional.text-section.title.distribution-statistics" defaultMessage="Статистика розподілу вакцин за закладами в" />:
                        </p>
                        </div>
                    </div>
                        
                    <div className="column is-4 has-text-centered">
                        <DropDownRegionSelectComponent 
                            onRegionSelect={this.selectRegionHandler} 
                            selectedRegion={this.state.selectedRegion} 
                            dropDownRegions={this.state.allRegions} 
                        />
                    </div>

                    <InstitituionalStatsReportComponent 
                        data={this.props.data} 
                        selectedRegion={this.state.selectedRegion} 
                    />

                </div>
            </section>
        ) : null;
    }

    componentDidMount() {
        const intl = this.context;
        const UKRAINE = intl.formatMessage({id:'direct-translation.Україна', defaultMessage:"Україна"});
        this.setState({
            allRegions: [UKRAINE].concat([...new Set(this.props.data.map(el => el.Rgn==UKRAINE ? null : el.Rgn).filter(el => el !== null))].sort()),
            selectedRegion: UKRAINE,
        });
    }
}

class DropDownRegionSelectComponent extends React.Component {
    static contextType = IntlContext;

    render() {
        const intl = this.context;

        const buttonStyle = {
            fontWeight: intl.formatMessage({id:"direct-translation."+this.props.selectedRegion, defaultMessage:this.props.selectedRegion}) === intl.formatMessage({id:"direct-translation.Україна", defaultMessage:"Україна"}) ? 'bold' : 'normal',
        };

        return (
                <div className="dropdown is-hoverable" style={this.props.style}>
                    <div className="dropdown-trigger">
                        <button className="button" aria-haspopup="true" aria-controls="dropdown-menu" style={buttonStyle}>
                            <span>{intl.formatMessage({id:"direct-translation."+this.props.selectedRegion, defaultMessage:this.props.selectedRegion})}</span>
                            <span className="icon is-small">
                                <i className="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                    <div className="dropdown-menu" id="dropdown-menu" role="menu">
                        <div className="dropdown-content">
                            {
                                this.props.dropDownRegions.map((region, index) => (
                                    <div key={index} className="dropdown-item has-text-dark" style={intl.formatMessage({id:"direct-translation."+region, defaultMessage:region}) === intl.formatMessage({id:"direct-translation.Україна", defaultMessage:"Україна"}) ? {fontWeight: 'bold'} : {}} onClick={() => this.props.onRegionSelect(region)}>
                                        {intl.formatMessage({id:"direct-translation."+region, defaultMessage:region})}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
            </div>
        );
    }
}

class InstitituionalStatsReportComponent extends React.Component {
    static contextType = IntlContext;
    render () {
        const intl = this.context;
        // Create a tree with vaccines and institutions
        const tree = this.props.data.reduce((acc, item) => {
            if ((this.props.selectedRegion === intl.formatMessage({id:'direct-translation.Україна', defaultMessage:"Україна"})) || (item.Rgn === this.props.selectedRegion)) {
                let vaccine = acc[item.Name];
                if (!vaccine) {
                    vaccine = { name: item.Name, facilities: [] };
                    acc[item.Name] = vaccine;
                }
                vaccine.facilities.push({ facility: item.Fclt, value: item.Amnt });
            }
            return acc;
        }, {});

        Object.keys(tree).forEach(vaccine => {
            tree[vaccine].facilities.sort((a, b) => a.value - b.value);
        });

        let quantile = 0.502;

        
        let facilities_in_region = Object.values(tree).reduce(
            (acc, item) => {
                item.facilities.forEach(el => acc.add(el.facility));
                return acc
            }, 
            new Set()
        ).size;

        return (
            <React.Fragment>
                <div className="column is-4">
                    <div>
                        <p className="title is-4 has-text-light has-text-centered">
                            <FormattedMessage id="institutional.text-section.title.reporting-facilities-amount" defaultMessage="Кількість закладів, які звітують" />:
                        </p>
                        <p className="title is-3 has-text-success has-text-centered">
                            {facilities_in_region}
                        </p>
                    </div>
                </div>
                <div className="column is-full">
                    <div className="columns is-vcentered is-multiline is-justify-content-center">
                        <div className="column is-full">
                            <div>
                                <p className="title is-4 has-text-light has-text-centered">
                                    <FormattedMessage id="institutional.text-section.title.every-vaccine-with-statistics" defaultMessage="Усі вакцини в регіоні і статистика по ним" />:
                                </p>
                            </div>
                        </div>

                        {
                            Object.keys(tree).sort().map((vaccine, i) => {
                                vaccine = tree[vaccine];
                                let vaccine_quantile_index = Math.floor(vaccine.facilities.length * 0.51);
                                let facilitiesReportingNoVaccine = vaccine.facilities.filter(el => el.value === 0);

                                return (
                                    <div key={i} className="column is-3 my-3">
                                        <p className="title is-4 has-text-light has-text-centered mb-3">
                                            <FormattedMessage id={`direct-translation.${vaccine.name}`} defaultMessage={vaccine.name}/>:
                                        </p>
                                        <div className="has-text-centered my-1">
                                            <p className="heading is-5 is-inline has-text-light mr-2">
                                                <FormattedMessage id="institutional.text-section.stats.reporting-about-vaccine" defaultMessage="Звітує про вакцину" />
                                            </p>
                                            <p className="title is-5 is-inline has-text-light mr-2">
                                                {vaccine.facilities.length} <FormattedMessage id="direct-translation.FACILITIES" defaultMessage="закладів" />
                                            </p>
                                        </div>
                                        <div className="has-text-centered my-1">
                                            
                                            {(() => {
                                                    let filteredData = vaccine.facilities.filter(el => !el.facility.toLowerCase().includes('цкпх'));
                                                    
                                                    return filteredData.length ? (
                                                        <>
                                                        <p className="heading is-5 is-inline has-text-light mr-2">
                                                            <FormattedMessage id="institutional.text-section.stats.top1-facility-stock" defaultMessage="Топ-1 заклад має" />
                                                        </p>
                                                        <p className="title is-5 is-inline has-text-light mr-2">{filteredData.at(-1).value}</p>
                                                        <p className="heading is-5 is-inline has-text-light">
                                                            <FormattedMessage id="direct-translation.UNITS" defaultMessage="доз" />
                                                        </p>
                                                        </>
                                                    ) : (
                                                        <p className="heading is-5 is-inline has-text-light mr-2 has-text-warning">
                                                            <FormattedMessage id="institutional.text-section.stats.absent-data-top1-facility-stock" defaultMessage="Немає інформації про наявність в Топ-1 закладі"/>
                                                        </p>
                                                    )
                                                })()
                                            }
                                            
                                        </div>
                                        <div className="has-text-centered my-1">
                                            <p className="heading is-5 is-inline has-text-light mr-2">
                                                <FormattedMessage id="institutional.text-section.stats.considering-this" defaultMessage="При цьому" />,
                                            </p>
                                            <p className="title is-5 is-inline has-text-light mr-2">
                                                {vaccine_quantile_index + 1} <FormattedMessage id="direct-translation.FACILITIES" defaultMessage="заклади" />
                                            </p>
                                            <p className="heading is-5 is-inline has-text-light">
                                            <FormattedMessage id="institutional.text-section.stats.have" defaultMessage="мають" />
                                            </p>
                                        </div>
                                        <div className="has-text-centered my-1">
                                            <p className="title is-5 is-inline has-text-light mr-2">
                                                ≤ {vaccine.facilities[vaccine_quantile_index].value}
                                            </p>
                                            <p className="heading is-5 is-inline has-text-light">
                                                <FormattedMessage id="direct-translation.UNITS" defaultMessage="доз" />
                                            </p>
                                        </div>
                                        <div className="has-text-centered my-1">
                                            <p className="heading is-5 is-inline has-text-light mr-2">
                                                <FormattedMessage id="institutional.text-section.stats.no-vaccine-at" defaultMessage="Жодної дози вакцини в" />
                                            </p>
                                            <p className="title is-5 is-inline has-text-light mr-2">
                                                <span className={facilitiesReportingNoVaccine.length == 0 ? "has-text-success" : "has-text-warning"}>{facilitiesReportingNoVaccine.length}</span> + <span className={(facilities_in_region - vaccine.facilities.length) == 0 ? "has-text-success" : "has-text-danger"}>{facilities_in_region - vaccine.facilities.length}</span>
                                            </p>
                                            <p className="heading is-5 is-inline has-text-light mr-2">
                                                <FormattedMessage id="direct-translation.FACILITIES" defaultMessage="закладах" />
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        }

                    </div>
                </div>
            </React.Fragment>
        );
    }
}


class LeftoversUsageExpirationComponent extends React.Component {
    constructor(props) {
        super(props);
        let dataWithExpirations = /*{}*/;
        let vaccinesExpectedToExpire = /*{}*/;
        let expirationTimelines = /*{}*/;
        let averageUsage = /*{}*/;
        let detailedUsage = /*{}*/;
        let usageTrends = /*{}*/;
        let futureSupplies = /*{}*/;
        let noFutureSuppliesForecast = /*{}*/;


        prepareJSONedDataFrame(dataWithExpirations);

        prepareJSONedDataFrame(vaccinesExpectedToExpire, false);

        prepareJSONedDataFrame(expirationTimelines, false);
        
        prepareJSONedDataFrame(noFutureSuppliesForecast, false);

        this.state = {
            dataWithExpirations,
            dataWithUsage: this.props.dataWithUsage,
            averageUsage,
            detailedUsage,
            usageTrends,
            vaccinesExpectedToExpire,
            expirationTimelines,
            futureSupplies,
            selectedRegion: 'Україна',
            includeUsage: true,
            noFutureSuppliesForecast,
        }

        this.allRegions = Object.keys(this.state.dataWithExpirations).sort((a,b) => {
            if (a === 'Україна') return -1;
            if (b === 'Україна') return 1;
            return a.localeCompare(b);
        });
    }

    selectRegionHandler = (value) => {
        (value !== this.state.selectedRegion) && this.setState({ selectedRegion: value });
    }

    usageTriggerHandler = (value) => {
        this.setState({ includeUsage: !this.state.includeUsage });
    }

    render() {
        return (
            <div id="leftovers-section">
                <LeftoversUsageExpirationChartSectionComponent
                    data={this.state.includeUsage ? this.state.dataWithUsage : this.state.dataWithExpirations} 
                    futureSupplies={this.state.futureSupplies}
                    selectedRegion={this.state.selectedRegion} 
                    allRegions={this.allRegions} 
                    onRegionSelect={this.selectRegionHandler}
                    onIncludeUsageClicked={this.usageTriggerHandler}
                    includeUsage={this.state.includeUsage}

                    addNewChart={this.props.addNewChart}
                />
                <LeftoversUsageExpirationInfographicsSectionComponent 
                    data={this.state.includeUsage ? this.state.dataWithUsage : this.state.dataWithExpirations} 
                    selectedRegion={this.state.selectedRegion}
                    includeUsage={this.state.includeUsage}
                    expirations={this.state.vaccinesExpectedToExpire}
                    expirationTimelines={this.state.expirationTimelines}
                    averageUsage={this.state.averageUsage}
                    detailedUsage={this.state.detailedUsage}
                    usageTrends={this.state.usageTrends}
                    noFutureSuppliesForecast={this.state.noFutureSuppliesForecast}

                    addNewChart={this.props.addNewChart}
                />
            </div>
        );
    }
}

class LeftoversUsageExpirationChartSectionComponent extends React.Component {
    static contextType = IntlContext;

    exportToExcel = () => {
        clg(this.props.data);
        const intl = this.context;
        let titles, aoa;

        if (this.props.selectedRegion == 'Україна'){
            const data = this.props.data;
            aoa = [];
            Object.keys(data).forEach(region => {
                titles = [intl.formatMessage({id:"direct-translation.REGION", defaultMessage:"Регіон"}), intl.formatMessage({id:"direct-translation.VACCINE", defaultMessage:"Вакцина"})].concat(data[region].index);
                aoa.push(titles);
                data[region].columns.forEach((vaccine, i) => {
                    aoa.push([
                        intl.formatMessage({id:"direct-translation."+region, defaultMessage:region}), 
                        intl.formatMessage({id:"direct-translation."+vaccine, defaultMessage:vaccine})
                    ].concat(data[region].data[i].map(el => el != 'Закінчилась' ? el : intl.formatMessage({id:"direct-translation.Закінчилась", defaultMessage:"Закінчилась"}))));
                });
                aoa.push([]);
            });
        }
        else {
            const data = this.props.data[this.props.selectedRegion];
            titles = [intl.formatMessage({id:"direct-translation.REGION", defaultMessage:"Регіон"}), intl.formatMessage({id:"direct-translation.VACCINE", defaultMessage:"Вакцина"})].concat(data.index);
            aoa = [titles];
            data.columns.forEach((vaccine, i) => {
                aoa.push([
                        intl.formatMessage({id:"direct-translation."+this.props.selectedRegion, defaultMessage:this.props.selectedRegion}), 
                        intl.formatMessage({id:"direct-translation."+vaccine, defaultMessage:vaccine})
                    ].concat(data.data[i].map(el => el != 'Закінчилась' ? el : intl.formatMessage({id:"direct-translation.Закінчилась", defaultMessage:"Закінчилась"}))));
            });
        }
        exportToXLSX(aoa, this.props.includeUsage ? intl.formatMessage({id:"leftovers.chart.title", defaultMessage:"Прогноз обсягу залишків за використанням"}) : intl.formatMessage({id:"leftovers.chart.title-no-usage", defaultMessage:"Прогноз обсягу залишків за терміном придатності"}));
        
    }

    render() {
        return (
            <section id="section-5" className="hero is-fullheight">
                <div className="two-section-container">
                    <div className="sticky">
                        <div className="pos-tc region-selector is-flex">
                            <DropDownRegionSelectComponent 
                            onRegionSelect={this.props.onRegionSelect} 
                            selectedRegion={this.props.selectedRegion} 
                            dropDownRegions={this.props.allRegions}
                            />

                            <div className="checkbox-wrapper usage-includer" onClick={this.props.onIncludeUsageClicked}>
                                <input id="check" type="checkbox" className="plus-minus" checked={this.props.includeUsage} onChange={this.props.onIncludeUsageClicked}/>
                                <p className="has-text-white-ter"><b>{this.props.includeUsage ?  <FormattedMessage id="leftovers.chart.usage-switch.overall-stats" defaultMessage="Показати Загальну Статистику"/> : <FormattedMessage id="leftovers.chart.usage-switch.usage-included-stats" defaultMessage="Показати Статистику на Основі Споживання"/>}?</b></p>
                            </div>
                        </div>
                    </div>
                </div>
                {/*
                <img
                src="https://www.cam.ac.uk/sites/www.cam.ac.uk/files/styles/content-885x432/public/news/research/news/gettyimages-1501082127-dp.jpg?itok=v8Y6IdpV" />
                */}
                <div className="chart" id="section-5-chart"></div>
            </section>
        );
    }

    componentDidMount() {
        let leftoversChartHolder = document.getElementById('section-5-chart');
        let chart = echarts.init(leftoversChartHolder);
        let data = this.props.data[this.props.selectedRegion];
        let region = this.props.selectedRegion;
        let reference = {data};
        this.reference = reference;
        // Get current rem in px
        let rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

        let option = Object.assign({}, globalOption);
        
        // Stacked line timeline chart 
        Object.assign(option, {
            colors: vaccineColors,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                textStyle:{
                    fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
                },
                order: 'seriesDesc'
            },
            textStyle: {
                color: 'hsl(0, 0%, 82%)'
            },
            title: {
                left: '25px',
                top: '15px',
                textStyle: {
                    fontSize: "1.4rem",
                    color: 'hsl(0, 0%, 88%)'
                },

            },
            legend: {
                top: 2.75*rem,
                left: 'center',
                data: data.columns,
                selected: data.columns.reduce((acc, item) => {
                    acc[item] = true;
                    return acc;
                }, {}),
                textStyle: {
                    fontSize: '15px',
                    color: 'hsl(0, 0%, 82%)'
                },
            },
            xAxis: {
                type: 'time',
            },
            yAxis: {
                type: 'value',
                boundaryGap: ['0%', '10%'],
                splitLine: {
                    show: true,
                    lineStyle:{
                        type: [5, 10, 10, 10],
                        color: 'hsl(0, 0%, 33%)'
                    }
                }
            },
            dataZoom: [
            {
                id: 'dataZoomX',
                type: 'slider',
                xAxisIndex: [0],
                filterMode: 'filter',   // Set as 'filter' so that the modification
                                        // of window of xAxis will effect the
                                        // window of yAxis.
                start: 0,
                end: this.props.includeUsage? 100 : 100,
            },
            ],
            grid: {
                left: '85px',
                right: '2%',
                top: '85px',
                bottom: '75px'
            },

            toolbox: {
                right: '2%',
                top: '1%',
                feature: {
                    saveAsImage: {},
                    myRestore: {
                        show: true,
                        title: 'Відновити',
                        // An icon that looks like we are restoring the chart
                        icon: "path://M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2",
                        onclick: function () {
                            chart.setOption({
                                legend: {
                                    selected: Object.entries(chart.getOption().legend[0].selected).reduce((acc, item) => {
                                        acc[item[0]] = true && reference.data.columns.includes(item[0]);
                                        return acc;
                                    }, {})
                                }
                            });
                        }
                    }
                }
            },

        });
        
        chart.setOption(option);
        this.props.addNewChart(chart);    
        this.chart = chart;  


        let lastClickTime = 0;
        let clickTimeout = null;

        chart.on('legendselectchanged', function (params) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;
        
            if (timeDiff < 300) { // If time difference is less than 300ms, consider it as a double click
                if (clickTimeout) clearTimeout(clickTimeout); // Clear the previous timeout
        
                Object.keys(params.selected).forEach(name => {
                    if (params.selected[name]) {
                        chart.dispatchAction({
                            type: 'legendUnSelect',
                            name: name
                        });
                    }
                });

                chart.dispatchAction({
                    type: 'legendSelect',
                    name: params.name
                });


                // chart.setOption({});
        
            } else { // If it's not a double click, start a timeout
                clickTimeout = setTimeout(function() {
                    // Add your single click functionality here
                }, 150);
            }
        
            lastClickTime = currentTime;
        });         
    }

    componentDidUpdate() {
        const intl = this.context;

        let data = this.props.data[this.props.selectedRegion];
        this.reference.data = data;
        const multipleSuppliesController = {};

        this.chart.setOption({
            title:{
                text: intl.formatMessage({id:"leftovers.chart.title", defaultMessage:'Прогноз обсягу залишків'}),
            },
            legend: {
                data: data.columns,
                selected: Object.entries(this.chart.getOption().legend[0].selected).reduce((acc, item, i) => {
                    acc[item[0]] = item[1] && data.columns.includes(item[0]);
                    return acc;
                },{}),
                formatter: (el) => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})
            },
            tooltip: {
                formatter: (params) => {
                    let date = new Date(params[0].data[0]);
                    let dateStr = date.toLocaleDateString("uk-UA");
                    let tooltip = `<b>${dateStr}</b><br/>`;
                    params.forEach((el, index) => {
                        tooltip += `<div class="is-flex is-justify-content-space-between mt-1">
                            <span class="mr-3">
                                <svg height="10" width="10">
                                    <circle cx="5" cy="5" r="5" fill="${el.color}"/>
                                </svg>
                                ${intl.formatMessage({id:`direct-translation.${el.seriesName}`, defaultMessage:el.seriesName})}
                            </span> 
                            <b>${el.data[1] != "Закінчилась" ? el.data[1] : (intl.formatMessage({id:"direct-translation.Закінчилась",defaultMessage:"Закінчилась"}))}</b>
                            </div>
                        `;
                    });
                    return tooltip;
                }
            },
            dataZoom: [{
                start: 0,
                end: this.props.includeUsage ? 100 : 100,
            }],
            xAxis: {
                data: data.index.map(el => new Date(el)),
            },
            
            series: data.data.map((el, index) => {
                return {
                    name: data.columns[index],
                    type: 'line',
                    stack: 'stack',
                    smooth: true,
                    sampling: 'average',
                    symbol: 'emptyCircle',
                    symbolSize: 6,
                    lineStyle: {
                        width: 1.5,
                    },
                    itemStyle: {
                        color: vaccineColors[index],
                    },
                    areaStyle: {
                        color: vaccineColors[index],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: vaccineColors[index],
                        },
                        {
                            offset: 1,
                            color: vaccineColors[index]+'06',
                        }
                        ], 
                        false
                        )
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    data: el.map((el, i) => {
                        return [new Date(data.index[i]), el];
                    }),
                    markPoint: {
                        data: (!this.props.futureSupplies[data.columns[index]] || this.props.selectedRegion!='Україна') ? [] : Object.entries(this.props.futureSupplies[data.columns[index]]).map((dateAmountPair,i) => {
                                clg(dateAmountPair);
                                const correction = 1;
                                !multipleSuppliesController[dateAmountPair[0]] && (multipleSuppliesController[dateAmountPair[0]] = 0);
                                const supplyDate = new Date(dateAmountPair[0]);
                                let supplyDateWithCorrection = new Date(dateAmountPair[0]);
                                supplyDateWithCorrection.setDate(supplyDate.getDate() + (multipleSuppliesController[dateAmountPair[0]]));

                                const result =  { 
                                    // symbol: "path://M276.783,119.911c1.685-1.725,2.427-4.017,2.246-6.245h0.09C270.389,49.563,215.295,0,148.834,0 C82.575,0,27.615,49.26,18.629,113.079c-0.014,0.099-0.032,0.197-0.042,0.296c-0.013,0.098-0.027,0.194-0.04,0.291h0.023 c-0.141,2.188,0.606,4.423,2.26,6.112l90.027,91.888H90.333c-13.808,0-25.333,11.193-25.333,25v36c0,13.807,11.525,25,25.333,25 h116c13.808,0,24.667-11.193,24.667-25v-36c0-13.807-10.859-25-24.667-25h-19.258L276.783,119.911z M165.945,210.39l31.14-104.235 c6.882-9.863,18.306-16.321,31.245-16.321c15.137,0,28.207,8.829,34.349,21.616L165.945,210.39z M116.982,107.045 c6.806-10.363,18.525-17.212,31.852-17.212c13.073,0,24.605,6.59,31.462,16.626l-31.384,105.052L116.982,107.045z M34.576,110.945 c6.241-12.513,19.158-21.112,34.094-21.112c13.01,0,24.49,6.527,31.359,16.481l31.734,103.827L34.576,110.945z M173,246.666v16h-17 v17h-16v-17h-17v-16h17v-17h16v17H173z", 
                                    symbol: "path://M297 202.349h-9v-39c0-12.683-9.984-23-22.667-23h-8.872l-10.127-40H192v-9c0-18.196-14.471-33-32.667-33h-126C15.137 58.349 0 73.152 0 91.349v94c0 18.196 15.137 33 33.333 33h4.555c-.004-.221-.017-.438-.017-.66 0-5.471 1.204-10.664 3.347-15.34h-7.885c-9.374 0-17.333-7.626-17.333-17v-94c0-9.374 7.959-17 17.333-17h126c9.374 0 16.667 7.626 16.667 17v94c0 9.374-7.293 17-16.667 17h-50.885c2.143 4.676 3.347 9.869 3.347 15.34 0 .222-.013.439-.017.66h47.555c1.355 0 2.667-.092 3.667-.251v.251h21.888c-.004-.221-.017-.438-.017-.66 0-20.382 16.581-36.963 36.961-36.963 20.382 0 36.963 16.581 36.963 36.963 0 .222-.013.439-.017.66H297V202.349zM242.795 217.688c0-11.559-9.404-20.963-20.963-20.963-11.558 0-20.961 9.404-20.961 20.963 0 11.559 9.403 20.963 20.961 20.963C233.391 238.651 242.795 229.247 242.795 217.688zM221.832 224.269c-3.633 0-6.578-2.945-6.578-6.58 0-3.635 2.945-6.58 6.578-6.58 3.635 0 6.58 2.945 6.58 6.58C228.412 221.323 225.467 224.269 221.832 224.269zM95.795 217.688c0-11.559-9.404-20.963-20.963-20.963-11.558 0-20.961 9.404-20.961 20.963 0 11.559 9.403 20.963 20.961 20.963C86.391 238.651 95.795 229.247 95.795 217.688zM74.832 224.269c-3.633 0-6.578-2.945-6.578-6.58 0-3.635 2.945-6.58 6.578-6.58 3.635 0 6.58 2.945 6.58 6.58C81.412 221.323 78.467 224.269 74.832 224.269zM88 146.349 88 168.349 104 168.349 104 146.349 126 146.349 126 130.349 104 130.349 104 108.349 88 108.349 88 130.349 66 130.349 66 146.349zM132 254 132 331c-10 5-23 5-33 0C123 344 135 359 146 377 156 359 170 344 193 331 183 336 170 336 160 331L160 254Z", 
                                    symbolKeepAspect: true,
                                    symbolSize: 45,
                                    xAxis: supplyDateWithCorrection,
                                    y: 135,
                                    emphasis: {
                                        label: {
                                            show: true,
                                            position: 'top',
                                            fontSize: 12,
                                            color: (params) => {
                                                return "white";
                                            },
                                            fontWeight: 'bold',
                                            formatter: () => `${dateAmountPair[1]['Кількість доз']} ` + 
                                            `${intl.formatMessage({id:"leftovers.chart.future-supplies.doses of", defaultMessage: "доз"})} ` +
                                            `${intl.formatMessage({id:"direct-translation."+data.columns[index], defaultMessage:data.columns[index]})}` + 
                                            `\n` + 
                                            `${intl.formatMessage({id:"leftovers.chart.future-supplies.will be delivered on", defaultMessage: "будуть доставлені"})} ` +
                                            `${supplyDate.toLocaleDateString("uk-UA")}` +
                                            `\n` +
                                            `${intl.formatMessage({id:"leftovers.chart.future-supplies.responsible for import", defaultMessage: "Відповідальний за імпорт"})}: ` +
                                            `${dateAmountPair[1]['Відповідальний за імпорт'].length < 35 ? dateAmountPair[1]['Відповідальний за імпорт'] : dateAmountPair[1]['Відповідальний за імпорт'].slice(0, 35 - 1) + '...'}`
                                        }
                                    }
                                };

                                multipleSuppliesController[dateAmountPair[0]] = (multipleSuppliesController[dateAmountPair[0]] <= 0) ? (correction - multipleSuppliesController[dateAmountPair[0]]) : -multipleSuppliesController[dateAmountPair[0]];
                                return result;


                            })

                    },
                }
            }),

            toolbox: {
                feature: {
                    saveAsImage: {
                        title: intl.formatMessage({id:"direct-translation.SAVE-AS-IMAGE", defaultMessage:'Зберегти як зображення'}),
                    },
                    myRestore: {
                        title: intl.formatMessage({id:"direct-translation.RESTORE", defaultMessage:'Відновити'}),
                    },
                    mySaveData: {
                        show: true,
                        title: intl.formatMessage({id:'direct-translation.EXPORT-TO-EXCEL', defaultMessage:'Експортувати в Excel'}),
                        icon: 'path://M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM11 12C10.4477 12 10 12.4477 10 13V17V21C10 21.5523 10.4477 22 11 22H15H21C21.5523 22 22 21.5523 22 21V17V13C22 12.4477 21.5523 12 21 12H15H11ZM12 16V14H14V16H12ZM16 16V14H20V16H16ZM16 20V18H20V20H16ZM14 18V20H12V18H14Z',
                        onclick: this.exportToExcel
                    }
                }
            }
        });
    }
}

class LeftoversUsageExpirationInfographicsSectionComponent extends React.Component {
    static contextType = IntlContext;

    constructor(props) {
        super(props);

        let expirations = this.props.expirations['Україна'];

        let totalExpirations = expirations.columns.reduce((acc, item, i) => {
            // Sum all expirations in all available regions
            acc[item] = expirations.data[i].reduce((acc, item) => acc + item, 0);
            return acc;
        }, {});

        this.maxExpiration = Math.max(...Object.values(totalExpirations));

        this.state = {
            toggleMap: false,
        }
    }

    handleToggleMapClicked = (chart) => {
        let tile = document.getElementById('vaccineCoverageTile');
        tile.classList.toggle('is-4');
        tile.classList.toggle('is-12');
        let interval = window.setInterval(() => chart.resize(), 25);
        window.setTimeout(() => window.clearInterval(interval), 600);
        this.setState({ toggleMap: !this.state.toggleMap });
    }

    /*
    Depending on if the usage is includded,  different sections are rendered:
    • USAGE INCLUDED
        1. Show how many vaccine is going to expire in Ukraine under the current usage. Total and vaccine-vice
        2. Show how many vaccine is required to be used daily in Ukraine to avoid expiration, by vaccine

        3. Show how many vaccine is going to expire in selectedRegion under the current usage, by vaccine
        EITHER:
        4. Show how many vaccine is required to be used daily in selectedRegion to avoid expiration, by vaccine
        OR:
        4. Show how many vaccine is needed to be moved (and where) to avoid expiration in selectedRegion, by vaccine

        5. Show how many vaccine is required (if any) in selectedRegion to cover 3-month period, by vaccine


    • USAGE NOT INCLUDED
        1. Show the total amount of leftovers by each year of expiration
        2. Show the usage of each vaccine in selectedRegion
        3. Show the trends of usage of each vaccine in selectedRegion
    */
    render() {
        let intl = this.context;

        const PHRASES = [
            (region) => <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-1-1" defaultMessage="Ризики утилізації вакцини відсутні для {region}" values={{region}}/>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-2-1" defaultMessage="А ну гляньте, хто це тут без проблем?" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-2-2" defaultMessage="Здається, це {region}!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-3-1" defaultMessage="О, які ми молодці!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-3-2" defaultMessage="А хто точно молодець? А {region} молодець!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-4-1" defaultMessage="А ось і наша молодчинка!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-4-2" defaultMessage="Ей, {region}, йди шепну на вушко: ти просто зірка!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-5-1" defaultMessage="Хто тут без проблем?" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-5-2" defaultMessage="Очевидно! Це ж {region}!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-6-1" defaultMessage="Ура!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-6-2" defaultMessage="А {region} таки вміє показати як вживати вакцину!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-7-1" defaultMessage="Ого, ну і дає {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-7-2" defaultMessage="Ну у вас же все просто бімба!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-8-1" defaultMessage="Вітаємо, {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-8-2" defaultMessage="Знаєте, чому ми усміхаємось? Бо вакцина у вас не псується!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-9-1" defaultMessage="Так тримати, {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-9-2" defaultMessage="Не знаю, як у інших, а у вас усе супер!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-10-1" defaultMessage="Хто тут найкращий?" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-10-2" defaultMessage="Безумовно, {region}!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-11-1" defaultMessage="Усім би бути як {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-11-2" defaultMessage="Чому? Бо у вас усе бомбезно!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-12-1" defaultMessage="Ось хто точно знає, як треба працювати!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-12-2" defaultMessage='В сенсі "хто?"? Звичайно, {region}!' values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-13-1" defaultMessage="А ось і наш чемпіон!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-13-2" defaultMessage="Так-так, {region}, ви просто супер!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-14-1" defaultMessage="Чому це тут не відображаються проблеми?" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-14-2" defaultMessage="Елементарно, Ватсон! Бо це ж {region}, тут їх нема!" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-15-1" defaultMessage="Ура, {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-15-2" defaultMessage="У вас усе просто космос!" values={{region}}/></React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-16-1" defaultMessage="Привітик, {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-16-2" defaultMessage="Ви знали, що у вас без проблем? (і у нас, разом з вами)" values={{region}}/>
            // </React.Fragment>,
            // (region) => <React.Fragment>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-17-1" defaultMessage="Уау, {region}!" values={{region}}/>
            //     <br/>
            //     <FormattedMessage id="leftovers.infographics.include-usage.funny-phrases-17-2" defaultMessage="Вакцина не псується – то й ЦГЗ сміється!" values={{region}}/>
            // </React.Fragment>,
        ];

        const replacement = this.props.selectedRegion == "м. Київ" ? 
            (<span><b className="has-text-success">{intl.formatMessage({id:"direct-translation.Київ", defaultMessage: "Києва"})}</b></span>) :
            (this.props.selectedRegion == "Україна" ? 
                (<b className="has-text-success">{intl.formatMessage({id:"leftovers.infographics.include-usage.whole-Ukraine", defaultMessage: "України"})}</b>) :
                (<span><b className="has-text-success">{intl.formatMessage({id:`direct-translation.${this.props.selectedRegion.replace("ська", "ської").replace("цька", "цької")})}`, defaultMessage: this.props.selectedRegion.replace("ська", "ської").replace("цька", "цької")})} {intl.formatMessage({id: "direct-translation.REGION", defaultMessage:"області"})}</b></span>)
            )
        let phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)](replacement);

        let defaultOption = Object.assign({}, globalOption);
        Object.assign(defaultOption, {
            textStyle: {
                color: 'hsl(0, 0%, 96%)'
            },
            title:{
                textStyle: {
                    color: 'hsl(0, 0%, 96%)',
                    fontSize: "1rem",
                },
                top: '10px',
                left:'10px'
            },
            grid: {
                left: '15px',
                right: '10px',
                bottom: '10px',
                top: '40px',
                containLabel: true
            },
            legend: {
                show: false
            }
        });

        if (!this.props.includeUsage){
            let expirationTimelines = this.props.expirationTimelines[this.props.selectedRegion];

            let expiredByYears = expirationTimelines.index.reduce((acc, item, i) => {
                let year = new Date(item).getFullYear();
                let vaccineExpiring =  expirationTimelines.data.reduce((acc, item) => acc + item[i], 0);
                if (acc[year]) {
                    acc[year] = acc[year] + vaccineExpiring;
                }
                else{
                    acc[year] = vaccineExpiring;
                }
                return acc;
            }
            , {}
            );

            return (
                <section id="section-6" className="hero is-fullheight">
                    <div className="report-layer y-scrollable">
                        <div className="tile is-parent is-justify-content-space-around is-align-items-center mt-3">
                            {
                                Object.keys(expiredByYears).map((el, i) => {
                                    return (
                                        <div key={i} className="tile box is-2 mb-4">
                                            <div className="is-child">
                                                <p className="title has-text-white-ter">
                                                    {el}
                                                </p>
                                                <p className="subtitle has-text-white-ter">
                                                    <strong className="has-text-white-ter">{expiredByYears[el].toLocaleString()}</strong> <FormattedMessage id="leftovers.infographics.no-usage.vaccines-expiration-by-dates.units" defaultMessage="доз протермінуються протягом року"/>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <div className="tile is-ancestor mx-2 mb-0">
                        <div className="tile is-parent is-8">
                            <div className="tile is-child box map no-padding">
                                <UsageBarChartComponent
                                    addNewChart={this.props.addNewChart}

                                    averageUsage={this.props.averageUsage[this.props.selectedRegion]}
                                    detailedUsage={this.props.detailedUsage[this.props.selectedRegion]}

                                    defaultOption={defaultOption}
                                />
                            </div>
                        </div>
                        <div className="tile is-parent is-4">
                            <div className="tile is-child box map no-padding">
                                <UsageTrendsBarChartComponent
                                    addNewChart={this.props.addNewChart}

                                    usageTrends={this.props.usageTrends[this.props.selectedRegion]}

                                    defaultOption={defaultOption}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            );
        }
        else {
            let expirations = this.props.expirations[this.props.selectedRegion];

            let totalExpirations = expirations.columns.reduce((acc, item, i) => {
                // Sum all expirations in all available regions
                acc[item] = expirations.data[i].reduce((acc, item) => acc + item, 0);
                return acc;
            }, {});

            let data = this.props.data[this.props.selectedRegion];
            let noExpirations = Object.values(totalExpirations).every(el => el === 0);                    
                
            return (
                <section id="section-6" className="hero is-fullheight">
                    <div className="tile is-ancestor ml-3 mr-3 avoid-dropdown mb-3">
                        <div id="vaccineCoverageTile" className="tile is-4 is-vertical is-parent expandable">
                            <div className={"tile is-child box no-padding" + (this.state.toggleMap? ' map' : '')}>
                                <VaccineCoverageChartComponent 
                                    data={this.props.data}
                                    averageUsage={this.props.averageUsage}
                                    selectedRegion={this.props.selectedRegion}
                                    noFutureSuppliesForecast={this.props.noFutureSuppliesForecast}

                                    defaultOption={defaultOption}

                                    addNewChart={this.props.addNewChart}
                                    onToggleMapClicked={this.handleToggleMapClicked}
                                />
                            </div>
                        </div>
                        <div className="tile is-8 is-vertical">
                            <div className="tile">
                                {
                                    noExpirations ?
                                    <div className="tile is-parent">
                                        <div className="tile is-child box">
                                            <div className="is-flex is-flex-direction-column is-justify-content-center is-align-items-center height-100">
                                                <p className="huge-font has-text-centered">
                                                    🤩
                                                </p>
                                                <p className="title is-4 has-text-centered mb-0 has-text-light">
                                                    {
                                                        phrase
                                                    }
                                                </p>
                                                {/* <p className="huge-font has-text-centered">
                                                    ❣️
                                                </p> */}
                                            </div>
                                        </div>
                                    </div>
                                    :
                                    <React.Fragment>
                                        <div className="tile is-parent">
                                            <div className="tile is-child box no-padding">
                                                    <VaccinesExpectedToExpireChartComponent
                                                        addNewChart={this.props.addNewChart}
                                                        expirations={totalExpirations}
                                                        maxExpiration={this.maxExpiration}
                                                        defaultOption={defaultOption}
                                                    />
                                            </div>
                                        </div>
                                        <div className="tile is-parent">
                                            <div className="tile is-child box no-padding">
                                                    <UsageRequiredToAvoidExpirationChartComponent
                                                        addNewChart={this.props.addNewChart}
                                                        expirations={expirations}
                                                        defaultOption={defaultOption}
                                                    />
                                            </div>
                                        </div>
                                    </React.Fragment>
                                }
                            </div>
                            <div className="tile is-parent">
                                <div className="tile is-child box no-padding triple-chart">
                                    <RequiredSupplyToCoverNeedsTripleChartComponent 
                                        data={this.props.data}
                                        averageUsage={this.props.averageUsage}
                                        selectedRegion={this.props.selectedRegion}

                                        addNewChart={this.props.addNewChart}
                                        defaultOption={defaultOption}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            );
        }
    }
}

class ChartComponent extends React.Component {
    render() {
        return (
            <div className="chart" id={this.props.id}></div>
        );
    }

    componentDidMount() {
        let chartHolder = document.getElementById(this.props.id);
        let chart = echarts.init(chartHolder);

        this.props.onChartInitialized(chart);
    }
}

class VaccineCoverageChartComponent extends React.Component {
    static contextType = IntlContext;

    state = {
        mapView: false,
        vaccineDisplayed: 'ІПВ',
    }

    onToggleMapClicked = () => {
        this.props.onToggleMapClicked(this.chart);

        let showMap = !this.state.mapView;

        this.chart.clear();
        this.chart.setOption(this.props.defaultOption);
        this.chart.setOption(showMap ? this.mapOption : this.barOption);
        this.setState({ mapView: showMap });
    }

    onVaccineSelected = (vaccine) => {
        this.setState({ vaccineDisplayed: vaccine });
    }

    barOption = {
        visualMap: {
            type: 'continuous',
            min: 1,
            max: 7,
            dimension: 0,
            inRange: {
                color: [
                    '#ff421a',
                    '#f7797c',
                    '#c8ffb2',
                ]
            },
            text: ['≥10', '≈0'],
            orient: 'vertical',
            right: 0,
            top: 'center',

            indicatorStyle: {
                color: 'hsl(0, 0%, 11%)',
            },

            textStyle: {
                color: 'hsl(0, 0%, 96%)'
            },
        },
        title: {
            text: "Поточна забезпеченість (місяців)",
        },
        textStyle: {
            color: 'hsl(0, 0%, 96%)'
        },
        xAxis: {
            type: 'value',
            boundaryGap: 0,
            splitLine: {
                show: true,
                lineStyle:{
                    type: [5, 10, 10, 10],
                    color: 'hsl(0, 0%, 33%)'
                }
            }
        },
        yAxis: {
            type: 'category',
            // Rotate the labels so that they don't overlap
            axisLabel: {
                rotate: 0,
            }
        },
        grid: {
            right: '40px',
            top: 50,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            position: 'right'
        },
        toolbox:{
            // Add my custom button that shows map instead of the chart
            itemSize: 35,
            top: 5,
            right: 5,
            
            feature: {
                myToggleMap: {
                    show: true,
                    title: 'Відобразити на мапі',
                    // An icon that looks like a map
                    icon: `path://M125.77,48.01c-0.62-1.67-1.21-3.24-1.16-4.99c0.08-2.82-0.63-4.89-2.17-6.33c-2.5-2.34-6.07-2-9.85-1.65
                    c-3.37,0.32-6.86,0.65-9.67-0.76c-4.02-2-7.15-0.85-9.43-0.01c-2.44,0.89-4.19,1.54-7.84-0.73c-3.07-1.92-4.23-4.11-5.35-6.22
                    c-1.45-2.73-3.26-6.14-8.8-6.63c-7.81-0.7-12.31,6.12-15.61,11.1c-3.64,5.5-4.61,6.15-5.87,5.41c-4.67-2.75-8.5-1.12-11.03-0.03
                    c-1.84,0.79-2.67,1.07-3.5,0.74c-0.56-0.22-1.19-0.44-1.86-0.65c-0.21-0.06-0.42-0.13-0.64-0.19c-0.42-0.12-0.85-0.24-1.3-0.35
                    c-6.05-1.49-14.71-2.14-20.16-0.21c-0.01,0-0.01,0-0.02,0.01c-0.04,0.02-0.08,0.03-0.13,0.05c-1.5,0.55-2.75,1.3-3.62,2.29
                    c-0.84,0.96-1.31,2.06-1.39,3.24c-0.08,1.18,0.22,2.42,0.9,3.66c5.12,9.22,4.2,12.82-2.18,22.26c-4.2,6.21-3.1,10.16-1.45,12.37
                    c4.26,5.71,16.47,4.78,22.06,3.01c3.83-1.21,6.53-2.98,8.92-4.55c3.37-2.21,5.4-3.54,9.22-2.77c6.69,1.34,12.21,8.04,12.21,10.85
                    c-0.28,0.44-0.96,1.28-1.47,1.92c-2.35,2.92-5.28,6.56-4.66,10.37c0.2,1.25,0.9,3.03,3.05,4.41c6.13,3.93,11.89-3.95,16.51-10.28
                    c1.14-1.57,2.73-3.75,3.82-4.9c2.47,2.23,5.22,3.02,7.69,3.23c-0.33,1.03-0.45,2.07-0.3,3.16c0.53,3.82,3.93,6.31,10.72,11.27
                    c1.21,0.88,2.6,1.33,4.11,1.33c0.64,0,1.31-0.08,1.99-0.25c5.62-1.36,11.01-8.15,12.31-10.76c1.07-2.14,0.74-3.82,0.27-4.86
                    c-1.28-2.83-4.64-3.71-7.89-4.57c-1-0.26-2.54-0.67-3.39-1.05c1.38-2.48,5.5-5.35,9.17-7.91c4.1-2.85,7.97-5.55,9.58-8.6
                    c0.83-1.57,0.75-3.25,0.68-4.73c-0.11-2.45,0.07-2.62,0.87-2.97c0.29-0.13,0.58-0.26,0.85-0.38s
                    C128.41,57.37,127.54,52.77,125.77,48.01z`,
                    onclick: this.onToggleMapClicked,
                },
            }
        },
    }
    mapOption = {
        title: {
            text: "Поточна забезпеченість (місяців)",
            textStyle:{
                fontSize: 22
            },
            left: 20,
            right: 20
        },
        tooltip: {
            trigger: 'item',
            showDelay: 0,
            transitionDuration: 0.2,
            textStyle:{
                fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
            },
        },
        select:{
            disabled: true,
        },
        
        visualMap: {
            type: 'continuous',
            min: 1,
            max: 7,
            dimension: 0,
            calculable: true,
            inRange: {
                color: [
                    //'#1f3d2d',
                    //'#79BD9A',
                    //'#8ace8a',

                    // '#F56D6B',
                    // '#474b53',
                    // '#b0e4c0',

                    '#181B20',
                    '#5e7d7a',
                    '#aae0a9',
                ]
            },
            text: ['≥7', '≈0'],
            orient: 'vertical',
            left: 10,
            bottom: 10,

            textStyle: {
                fontFamily: globalOption.textStyle.fontFamily,
                color: 'hsl(0, 0%, 96%)'
            },
        },

        toolbox:{
            // Add my custom button that shows map instead of the chart
            itemSize: 25,
            top: 5,
            right: 5,
            
            feature: {
                myToggleMap: {
                    show: true,
                    title: 'Повернутись до стовпчикової діаграми',
                    // A barchart icon
                    icon: `path://m 4.7625005,289.0625 c -0.4351599,0 -0.7947821,0.35807 -0.7947821,0.79323 v 0.84336 c -0.08298,-0.0298 -0.1708388,-0.0486 -0.263552,-0.0486 H 3.1744845 c -0.435163,0 -0.792716,0.35756 -0.792716,0.79272 v 1.10846 c -0.08358,-0.0303 -0.172108,-0.0496 -0.265617,-0.0496 h -0.529683 c -0.435163,0 -0.79271795,0.35756 -0.79271795,0.79272 v 2.3828 c 0,0.43516 0.35755495,0.79323 0.79271795,0.79323 h 0.529683 c 0.203464,0 0.388191,-0.0805 0.529166,-0.20826 0.140975,0.12778 0.325702,0.20826 0.529167,0.20826 h 0.5296819 c 0.203322,0 0.3877101,-0.0806 0.528651,-0.20826 0.141396,0.12762 0.3263611,0.20826 0.5296831,0.20826 h 0.5291659 c 0.2034281,0 0.3882001,-0.0805 0.5291669,-0.20826 0.1413989,0.12762 0.3263659,0.20826 0.5296847,0.20826 h 0.5270982 c 0.4351578,0 0.7952999,-0.35806 0.7952999,-0.79323 v -2.9099 c 0,-0.43516 -0.360137,-0.79479 -0.7952999,-0.79479 H 6.350518 c -0.09328,0 -0.1820648,0.0188 -0.2656178,0.0491 v -2.16628 c 0,-0.43516 -0.3580707,-0.79323 -0.7932338,-0.79323 z m 0,0.52916 h 0.5291659 c 0.151157,0 0.263552,0.11293 0.263552,0.26407 v 5.82187 c 0,0.15116 -0.112395,0.26406 -0.263552,0.26406 H 4.7625005 c -0.1511541,0 -0.2656149,-0.1129 -0.2656149,-0.26406 v -4.23437 -1.5875 c 0,-0.15114 0.1144608,-0.26407 0.2656149,-0.26407 z m -1.588016,1.58802 h 0.5296819 c 0.1511541,0 0.263552,0.11239 0.263552,0.26355 v 4.23437 c 0,0.15116 -0.1123979,0.26406 -0.263552,0.26406 H 3.1744845 c -0.151154,0 -0.265618,-0.1129 -0.265618,-0.26406 v -2.3828 -1.85157 c 0,-0.15116 0.114464,-0.26355 0.265618,-0.26355 z m 3.1760335,1.3224 h 0.5270982 c 0.1511538,0 0.2656179,0.11447 0.2656179,0.26562 v 2.9099 c 0,0.15116 -0.1144559,0.26406 -0.2656179,0.26406 H 6.350518 c -0.1511609,0 -0.2656178,-0.1129 -0.2656178,-0.26406 v -2.9099 c 0,-0.15114 0.1144648,-0.26562 0.2656178,-0.26562 z m -4.7640495,0.52917 h 0.529683 c 0.151153,0 0.265617,0.11239 0.265617,0.26355 v 2.3828 c 0,0.15115 -0.114464,0.26406 -0.265617,0.26406 h -0.529683 c -0.151154,0 -0.263552,-0.11291 -0.263552,-0.26406 v -2.3828 c 0,-0.15116 0.112398,-0.26355 0.263552,-0.26355 z`,
                    onclick: this.onToggleMapClicked,
                },
            }
        },
    }
    
    onChartInitialized = (chart) => {
        this.chart = chart;
        this.barPicture = `path://M21.131 34.495l9.064 9.169l14.244-14.408l-9.064-9.168z M43.13 20.072l-1.927-1.949l-1.887 1.909l-3.941-3.986L8.068 43.664l3.94 3.985l-4.48 4.523l-3.234-3.271L3 50.212L14.654 62l1.296-1.31l-3.24-3.277l4.479-4.525l3.941 3.985l27.306-27.617l-3.94-3.985l1.887-1.908l-1.928-1.95L59.736 5.959L61 2L43.13 20.072zM21.131 54.029l-10.25-10.365l24.494-24.773l10.249 10.365l-24.493 24.773z`

        chart.setOption(this.props.defaultOption);
        chart.setOption(this.barOption);

        let option = {
            series: [
            {
                type: 'pictorialBar',
                symbol: this.barPicture,
                symbolRepeat: 'fixed',
                symbolMargin: '-5%',
                symbolClip: true,
                markLine: {
                    data: [{
                        name: "Критична позначка",
                        xAxis: 3,
                    }],
                    lineStyle: {
                        color: '#f7797c',
                        type: [15, 15, 25, 15],
                        width: 2,
                    },
                }
            }]
        };

        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <div id="coverageChartContainer" className="is-relative">
                <VaccineDropdownComponent
                    display={this.state.mapView}
                    vaccineDisplayed={this.state.vaccineDisplayed}
                    onVaccineSelected={this.onVaccineSelected}
                />
                <ChartComponent 
                    id="vaccineCoverageChart"
                    onChartInitialized={this.onChartInitialized}
                />
            </div>
        );
    }

    componentDidUpdate() {
        const intl = this.context;
        if (!this.state.mapView) {
            let data = this.props.data[this.props.selectedRegion];
            clg(data);
            if (this.props.selectedRegion === 'Україна'){
                data = this.props.noFutureSuppliesForecast['Україна'];
            }
            clg(data);
            let coverage = data.columns.reduce((acc, item, i) => {
                // Calculate the difference in month between two dates (index dates and report date)
                let index = data.data[i].findIndex(el => el == 0);
                let coverageInMonth = monthInterval(REPORT_DATE, new Date(data.index[index]));

                acc[item] = coverageInMonth;
                return acc;
            }, {});

            this.chart.setOption({
                title:{
                    text: intl.formatMessage({id: "leftovers.infographics.coverage.title", defaultMessage:"Поточна забезпеченість (місяців)"})
                },
                yAxis: {
                    data: Object.keys(coverage).map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})),
                },
                series: [
                {
                    name: intl.formatMessage({id: "leftovers.infographics.coverage.series-name", defaultMessage:"Місяців"}),
                    type: 'pictorialBar',
                    symbol: this.barPicture,
                    symbolRepeat: 'fixed',
                    symbolMargin: '-5%',
                    symbolClip: true,
                    markLine: {
                        data: [{
                            name: "Критична позначка",
                            xAxis: 3,
                        }],
                        lineStyle: {
                            color: '#f7797c',
                            type: [15, 15, 25, 15],
                            width: 2,
                        },
                    },
                    
                    data: Object.values(coverage),
                }],

                toolbox:{
                    feature: {
                        myToggleMap: {
                            title: intl.formatMessage({id:"leftovers.infographics.coverage.show-map", defaultMessage:"Показати на мапі"}),
                        },
                    }
                }
            });
        }
        else {
            let vaccineDisplayed = this.state.vaccineDisplayed;
            let data = Object.keys(this.props.data).map(region => {
                if (region === 'Україна'){
                    return {};
                } 
                let vaccineIndex = this.props.data[region].columns.findIndex(el => el === vaccineDisplayed);
                if (vaccineIndex === -1){
                    return {
                        name: region,
                        value: null,
                    };
                }
                let vaccineEndsIndex = this.props.data[region].data[vaccineIndex].findIndex(el => el == 0);
                let vaccineEndsDate = new Date(this.props.data[region].index[vaccineEndsIndex]);
                let coverageInMonth = monthInterval(REPORT_DATE, vaccineEndsDate);
                return {
                    name: region,
                    value: coverageInMonth,
                }
            });

            this.chart.setOption(
            {
                title:{
                    text: intl.formatMessage({id: "leftovers.infographics.coverage.title", defaultMessage:"Поточна забезпеченість (місяців)"})
                },
                tooltip: {
                    formatter: (params) => {
                        let vaccine = intl.formatMessage({id:`direct-translation.${params.seriesName}`, defaultMessage: params.seriesName});
                        let tooltip = `<b>${vaccine}</b><br/>`;
    
                        tooltip += `<div class="is-flex is-justify-content-space-between mt-2">
                            <span class="mr-3">
                                <svg height="10" width="10">
                                    <circle cx="5" cy="5" r="5" fill="${params.color}"/>
                                </svg>
                                ${intl.formatMessage({id:`direct-translation.${params.name}`, defaultMessage: params.name})}
                            </span> 
                            <b>${params.value}</b>
                            </div>
                        `;
    
                        return tooltip;
                    }
                },
                series: [{
                    name: vaccineDisplayed,
                    type: 'map',
                    // roam: true,
                    map: 'Ukraine',
                    label: {
                        show: true,
                        formatter: (props) => {
                            return intl.formatMessage({id:`direct-translation.${props.name}`, defaultMessage:props.name})
                        },
                        textStyle:{
                            fontSize: 15,
                            color: 'hsl(0, 0%, 100%)',

                            textBorderColor: 'hsl(0, 0%, 4%)',
                            textBorderWidth: 1,
                        }
                    },

                    zoom: 1.2,

                    emphasis: {
                        label: {
                            fontFamily: globalOption.textStyle.fontFamily,
                        },
                        itemStyle: {
                            areaColor: 'white'
                        }
                    },

                    showLegendSymbol: false,

                    itemStyle:{
                        areaColor: '#eee',
                        borderColor: '#65857C',
                        borderWidth: 1,
                    },

                    data: data,
                }],

                toolbox:{
                    feature: {
                        myToggleMap: {
                            title: intl.formatMessage({id:"leftovers.infographics.coverage.return-to-barChart", defaultMessage:"Повернутись до стовпчикової діаграми"}),
                        },
                    }
                }
            });
        }
    }
}

class VaccineDropdownComponent extends React.Component {
    static contextType = IntlContext;

    render() {
        const intl = this.context;

        return (
            <div id="vaccineDropdown" className={this.props.display ? "" : "is-hidden"}>
                <div className="dropdown__container">
                    <input type="checkbox" id="dropdown"/>
                    
                    <label className="dropdown__face" htmlFor="dropdown">
                        <div className="dropdown__text tag is-success is-light is-medium"><b>{intl.formatMessage({id:`direct-translation.${this.props.vaccineDisplayed}`, defaultMessage: this.props.vaccineDisplayed})}</b></div>
                        
                        <div className="dropdown__arrow"></div>
                    </label>
                    
                    <ul className="dropdown__items">
                        <div className="tags">
                            {allVaccines.map((el, i) => {
                                return (
                                    <li key={i} className="tag is-info is-light" onClick={() => this.props.onVaccineSelected(el)}>
                                        {intl.formatMessage({id:`direct-translation.${el}`, defaultMessage: el})}
                                    </li>
                                    );
                                })}
                        </div>
                    </ul>
                </div>
                
                <svg>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </svg>
            </div>
        )
    }
}

class VaccinesExpectedToExpireChartComponent extends React.Component {
    static contextType = IntlContext;
    
    onChartInitialized = (chart) => {
        const barPicture = `path://M419.88,165.85H407.81a12.51,12.51,0,0,1-12.45-13.63,29.65,29.65,0,0,0-29.52-32.31H312.09V93.28A27.71,27.71,0,0,0,284.42,65.6H233.58a27.71,27.71,0,0,0-27.67,27.68v26.63H151.65a29.66,29.66,0,0,0-29.57,31.84l0,.67a12.5,12.5,0,0,1-12.47,13.43H98.12V203.7h22.35l19.29,217.42a23.61,23.61,0,0,0,23.63,21.63h186a23.69,23.69,0,0,0,23.59-21.2L396.27,203.7h23.61Zm-196-72.57a9.69,9.69,0,0,1,9.67-9.68h50.84a9.69,9.69,0,0,1,9.67,9.68v26.63H223.91ZM355,419.63a5.71,5.71,0,0,1-5.69,5.12h-186a5.7,5.7,0,0,1-5.7-5.22L138.54,203.7H378.17Z"/><path d="M306.36,307.3a47.56,47.56,0,0,1-7,24.81l-8-5.51a7.14,7.14,0,0,0-11.06,7.19l4.65,25a7.14,7.14,0,0,0,8.31,5.71l25-4.6A7.14,7.14,0,0,0,321,347l-7.87-5.41A64.24,64.24,0,0,0,258.81,243v16.71A47.6,47.6,0,0,1,306.36,307.3Z"/><path d="M193,260.41l7.87,5.41a64.23,64.23,0,0,0,54.33,98.55V347.66a47.53,47.53,0,0,1-40.55-72.36l8,5.51a7.14,7.14,0,0,0,11.06-7.19l-4.65-25a7.14,7.14,0,0,0-8.31-5.71l-25,4.6A7.13,7.13,0,0,0,193,260.41Z`

        this.chart = chart;

        chart.setOption(this.props.defaultOption);

        let option = {
            
            color: ['#f7797c'],
            /*
            visualMap: {
                min: 0,
                max: this.props.maxExpiration,
                inRange: {
                    color: [
                        '#d8ffc8',
                        '#f7797c',
                    ]
                },
                text: [this.props.maxExpiration, '0'],
                orient: 'horizontal',
                right: 0,
                top: 10,
            },
            */
            yAxis: {
                type: 'value',
                boundaryGap: 0,
                max: this.props.maxExpiration,
                splitLine: {
                    show: true,
                    lineStyle:{
                        type: [5, 10, 10, 10],
                        color: 'hsl(0, 0%, 33%)'
                    }
                }
            },
            xAxis: {
                type: 'category',
                // Rotate the labels so that they don't overlap
                axisLabel: {
                    rotate: 30,
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            series: [
            {
                type: 'pictorialBar',
                symbol: barPicture,
                symbolRepeat: true,
                symbolMargin: '25%',
                symbolClip: true,
                symbolSize: 40,
                // symbolSize: 70 + "%",
            }]
        };

        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <ChartComponent 
                id="vaccinesExpectedToExpireChart"
                onChartInitialized={this.onChartInitialized}/>
        );
    }

    componentDidUpdate() {
        const intl = this.context;

        let notZeroExpirations = Object.keys(this.props.expirations).reduce((acc, item) => {
            if (this.props.expirations[item] != 0) {
                acc[item] = this.props.expirations[item];
            }
            return acc;
        }, {});

        this.chart.setOption({
            title: {
                text: intl.formatMessage({id:`leftovers.infographics.expected-to-expire.title`, defaultMessage:"Очікувані втрати (доз)"}),
            },
            xAxis: {
                data: Object.keys(notZeroExpirations).map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})),
            },
            series: [
            {
                name: intl.formatMessage({id:`leftovers.infographics.expected-to-expire.title`, defaultMessage:'Кількість вакцини'}),
                data: Object.values(notZeroExpirations),
            }]
        });
    }
}

class UsageRequiredToAvoidExpirationChartComponent extends React.Component {
    static contextType = IntlContext;

    onChartInitialized = (chart) => {
        this.chart = chart;

        chart.setOption(this.props.defaultOption);

        let option = {
            visualMap: {
                min: 0,
                max: 2000,
                inRange: {
                    color: [
                        '#c8ffb2',
                        '#f7797c',
                        '#ff421a'
                        ]
                },
                text: ['≥1000', '≤0'],

                textStyle: {
                    color: 'hsl(0, 0%, 96%)',
                },

                orient: 'vertical',
                right: 0,
                top: 'center',
            },
            yAxis: {
                type: 'value',
                splitLine: {
                    show: true,
                    lineStyle:{
                        type: [5, 10, 10, 10],
                        color: 'hsl(0, 0%, 33%)'
                    }
                }
            },
            grid: {
                top: '60px',
                right: '40px',
            },
            xAxis: {
                type: 'category',
                // Rotate the labels so that they don't overlap
                axisLabel: {
                    rotate: 0,
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            series: [
            {
                type: 'bar',
            }]
        };

        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <ChartComponent 
                id="usageRequiredToAvoidExpirationChart"
                onChartInitialized={this.onChartInitialized}/>
        );
    }

    componentDidUpdate() {
        const intl = this.context;

        let expirations = this.props.expirations;

        let requiredUsageIncreases = expirations.columns.reduce((acc, vaccine, col) => {
            acc[vaccine] = 0;
            expirations.index.forEach((date, i) => {
                let expireAmount = expirations.data[col][i];
                let dayInterval = (new Date(date) - REPORT_DATE) / (1000 * 60 * 60 * 24);
                let requiredUsageIncrease = expireAmount / dayInterval;
                acc[vaccine] = expireAmount === 0 ? acc[vaccine] : (
                    acc[vaccine] < requiredUsageIncrease ? requiredUsageIncrease : acc[vaccine]
                )
            });

            acc[vaccine] = Math.round(acc[vaccine]*31);
            acc[vaccine] === 0 && delete acc[vaccine]; // Remove any mention of vaccines that are not going to expire;
            return acc
        }, {});

        this.chart.setOption({
            title: {
                text: intl.formatMessage({id:`leftovers.infographics.usage-to-avoid-losses.title`, defaultMessage:"Необхідне збільшення споживання\n(доз на місяць)"}),
            },
            xAxis: {
                data: Object.keys(requiredUsageIncreases).map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})),
            },
            series: [
            {
                name: intl.formatMessage({id:`leftovers.infographics.usage-to-avoid-losses.series-name`, defaultMessage:"Доз на місяць"}),
                data: Object.values(requiredUsageIncreases),
            }]
        });
    }
}

class AverageUsageMapChartComponent extends React.Component {
    onChartInitialized = (chart) => {
        let maxUsage = null;
        let data = Object.keys(this.props.averageUsage).map(el => {
            if (el === 'Україна'){
                return {};
            } 
            maxUsage = Math.max(maxUsage, this.props.averageUsage[el]['ІПВ']);
            return {
                name: el,
                value: Math.round(this.props.averageUsage[el]['ІПВ'])
            }
        });

        chart.setOption(this.props.defaultOption);

        let option = {
            tooltip: {
                trigger: 'item',
                showDelay: 0,
                transitionDuration: 0.2
                },
            visualMap: {
                min: 0,
                max: maxUsage,
                inRange: {
                    color: [
                        // '#252932',  
                        '#0F2D40',
                        '#e0ffd3',
                    ]
                },
                text: ['Макс', 'Мін'],
                textStyle:{
                    color: 'hsl(0, 0%, 86%)'
                },
                calculable: true,
                left: '10px',
                bottom: '10px',
            },
            series: [
            {
                name: 'ІПВ',
                type: 'map',
                // roam: true,
                map: 'Ukraine',
                label: {
                    show: true,
                    textStyle:{
                        fontSize: 12,
                        color: 'hsl(0, 0%, 4%)',

                        textBorderColor: 'hsl(0, 0%, 100%)',
                        textBorderWidth: 1.5,
                    }
                },

                zoom: 1.2,

                emphasis: {
                    label: {
                        fontFamily: 'Georgia',
                    },
                    itemStyle: {
                        areaColor: 'white'
                    }
                },

                data: data
            },
            ]
        };

        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <ChartComponent 
                id="averageUsageChart"
                onChartInitialized={this.onChartInitialized}/>
        );
    }
}

class UsageBarChartComponent extends React.Component {
    static contextType = IntlContext;

    onChartInitialized = (chart) => {
        let usage = this.props.detailedUsage;
        let averageUsage = this.props.averageUsage;
        this.chart = chart;
        
        let series = [];
        let seriesData = {}
        Object.keys(usage).forEach((date, i) => {
            Object.keys(usage[date]).sort().forEach((vaccine, j) => {
                seriesData[vaccine] ? (seriesData[vaccine].push(usage[date][vaccine])) : (seriesData[vaccine] = [usage[date][vaccine]]);
            });
        });

        Object.keys(seriesData).forEach((vaccine, i) => {
            seriesData[vaccine].push(Math.round(averageUsage[vaccine]));
            series.push({
                name: vaccine,
                type: 'bar',
                stack: 'total',
                label: {
                    show: true,
                    textStyle:{
                        fontFamily: 'Georgia',
                        color: 'hsl(0, 0%, 4%)'
                    }
                },
                itemStyle: {
                    borderRadius: 4,
                    // borderColor: '#fff',
                    borderWidth: 2
                },
                emphasis: {
                    focus: 'series'
                },
                data: seriesData[vaccine]
            });
        });
        
        let showLegend = true;
        let option = Object.assign({}, globalOption);
        Object.assign(option, {
            darkMode: true,
            // backgroundColor:'rgba(30, 31, 43, 0.7)',
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
                text: "Використання вакцин",
                left: '10',
                top: '10',
                textStyle: {
                    fontSize: "1rem",
                    color: 'hsl(0, 0%, 96%)'
                },
            },

            legend: {
                type: 'plain',
                left: "center",
                top: "45px",
                selectedMode: 'multiple',
                selected: Object.keys(seriesData).reduce((acc, item) => {
                    acc[item] = true;
                    return acc;
                }, {}),
                textStyle: {
                    fontSize: "15px",
                    color: '#ccc'
                }
            },
            xAxis: {
                type: 'category',
                data: (Object.keys(usage).map((date)=>{
                    return monthMapping[Number(date.slice(5,7))] + ' ' + date.slice(0, 4);
                })).concat('Усереднене\n(12 міс)'),
                axisLabel: {
                    interval: 0,
                    rotate: 55,
                    textStyle: {
                        fontFamily: globalOption.textStyle.fontFamily,
                        fontSize: "12px",
                    }
                }
            },

            yAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: "rgba(255, 255, 255, 0.2)"
                    }
                },
                textStyle: {
                    fontFamily: globalOption.textStyle.fontFamily,
                    fontSize: "13px",
                }
            },

            textStyle: {
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
                left: '70px',
                right: '10px',
                top: '60px',
                bottom: '100px'
            },

            series,

            toolbox: {
                show: true,
                top: 15,
                right: 15,
                feature: {
                    myRestore: {
                        show: true,
                        title: 'Відновити',
                        // An icon that looks like we are restoring the chart
                        icon: "path://M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2",
                        onclick: function () {
                            chart.setOption({
                                legend: {
                                    selected: Object.keys(seriesData).reduce((acc, item) => {
                                        acc[item] = true;
                                        return acc;
                                    }, {}),
                                }
                            });
                        }
                    },
                    myTool1: {
                        show: true,
                        title: 'Показати/приховати легенду',
                        icon: 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
                        onclick: function () {
                            showLegend = (showLegend) ? false : true;
                            chart.setOption({
                                legend: { show: showLegend }
                            })
                        }
                    },
                }
            }

        });

        
        // Handle legend double click
        let lastClickTime = 0;
        let clickTimeout = null;
        chart.on('legendselectchanged', function (params) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;
        
            if (timeDiff < 300) { // If time difference is less than 300ms, consider it as a double click
                if (clickTimeout) clearTimeout(clickTimeout); // Clear the previous timeout
        
                Object.keys(params.selected).forEach(name => {
                    if (params.selected[name]) {
                        chart.dispatchAction({
                            type: 'legendUnSelect',
                            name: name
                        });
                    }
                });

                chart.dispatchAction({
                    type: 'legendSelect',
                    name: params.name
                });


                // chart.setOption({});
        
            } else { // If it's not a double click, start a timeout
                clickTimeout = setTimeout(function() {
                    // Add your single click functionality here
                }, 150);
            }
        
            lastClickTime = currentTime;
        });
        
        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <ChartComponent 
                id="timeBasedUsageChart"
                onChartInitialized={this.onChartInitialized}/>
        );
    }

    componentDidUpdate() {
        const intl = this.context;
        let usage = this.props.detailedUsage;
        let averageUsage = this.props.averageUsage;
        let series = [];
        let seriesData = {};
        Object.keys(usage).forEach((date, i) => {
            Object.keys(usage[date]).sort().forEach((vaccine, j) => {
                seriesData[vaccine] ? (seriesData[vaccine].push(usage[date][vaccine])) : (seriesData[vaccine] = [usage[date][vaccine]]);
            });
        });

        Object.keys(seriesData).forEach((vaccine, i) => {
            // let vaccine_translated = intl.formatMessage({id:`direct-translation.${vaccine}`, defaultMessage:vaccine});
            seriesData[vaccine].push(Math.round(averageUsage[vaccine]));
            series.push({
                data: seriesData[vaccine],
                name: vaccine
            });
        });

        this.chart.setOption({
            title: {
                text: intl.formatMessage({id: "leftovers.infographics.no-usage.usageBarChart.title", defaultMessage:"Споживання вакцин"}),
            },
            xAxis: {
                data: (Object.keys(usage).map((date)=>{
                    return intl.formatMessage({id: `direct-translation.${monthMapping[Number(date.slice(5,7))]}`, defaultMessage:monthMapping[Number(date.slice(5,7))]}) + ' ' + date.slice(0, 4);
                
                })).concat(intl.formatMessage({id: "leftovers.infographics.no-usage.usageBarChart.averaged-usage-bar", defaultMessage:"Усереднене\n(12 міс)"})),
            },
            legend: {
                formatter: (el) => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})
            },
            tooltip: {
                formatter: (params) => {
                    let vaccine = intl.formatMessage({id:`direct-translation.${params.seriesName}`, defaultMessage: params.seriesName});
                    let tooltip = `<b>${vaccine}</b><br/>`;

                    tooltip += `<div class="is-flex is-justify-content-space-between mt-2">
                        <span class="mr-3">
                            <svg height="10" width="10">
                                <circle cx="5" cy="5" r="5" fill="${params.color.colorStops[1].color}"/>
                            </svg>
                            ${params.name}
                        </span> 
                        <b>${params.value}</b>
                        </div>
                    `;

                    return tooltip;
                }
            },

            series,

            toolbox: {
                feature: {
                    myRestore: {
                        title: intl.formatMessage({id:'direct-translation.RESTORE', defaultMessage:'Відновити'}),
                    },
                    myTool1: {
                        title: intl.formatMessage({id:'direct-translation.SHOW-HIDE-LEGEND', defaultMessage:'Показати/приховати легенду'})
                    },
                }
            }
        });
    
    }
}

class UsageTrendsBarChartComponent extends React.Component {
    static contextType = IntlContext;

    onChartInitialized = (chart) => {
        let trends = this.props.usageTrends;
        this.chart = chart;

        this.props.defaultOption && chart.setOption(this.props.defaultOption);

        let option = Object.assign({}, globalOption);
        Object.assign(option, {
            visualMap: {
                type: 'continuous',
                dimension: 0,
                inRange: {
                    color: [
                        '#ff421a',
                        'hsl(0, 0%, 92%)',
                        '#c8ffb2',
                    ]
                },
                orient: 'vertical',
                right: 0,
                top: 'center',

                indicatorStyle: {
                    color: 'hsl(0, 0%, 11%)',
                },

                textStyle: {
                    fontFamily: globalOption.textStyle.fontFamily,
                    color: 'hsl(0, 0%, 96%)'
                },
            },
            
            textStyle: {
                color: 'hsl(0, 0%, 96%)'
            },
            xAxis: {
                type: 'value',
                boundaryGap: 0,
                splitLine: {
                    show: true,
                    lineStyle:{
                        type: [5, 10, 10, 10],
                        color: 'hsl(0, 0%, 33%)'
                    }
                },

                axisLabel: {
                    rotate: 45,
                }
            },
            yAxis: {
                type: 'category',
            },
            grid: {
                top: '40px',
                right: '50px',
                bottom: '25px'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: "rgba(27, 27, 38, 0.933)",
                textStyle: {
                    fontFamily: (globalOption.tooltip && globalOption.tooltip.textStyle.fontFamily) || globalOption.textStyle.fontFamily,
                    color: '#ccc',
                    fontSize: 14
                },
                position: 'right'
            },
            series: [
            {
                type: 'bar',
            }]
        });
        
        chart.setOption(option);
        this.props.addNewChart(chart);
    }

    render() {
        return (
            <ChartComponent 
                id="usageTrendsChart"
                onChartInitialized={this.onChartInitialized}/>
        );
    }

    componentDidUpdate() {
        const intl = this.context;

        let [maxValue, minValue] = [Math.max(...Object.values(this.props.usageTrends)), Math.min(...Object.values(this.props.usageTrends))];
        let absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));
        this.chart.setOption({
            title: {
                text: intl.formatMessage({id:`leftovers.infographics.no-usage.trends-chart.title`, defaultMessage:"Тренди споживання (Приріст/Спад)"}),
            },
            visualMap: {
                max: absMax/2,
                min: -absMax/2,
                text: ['≤'+(absMax/2).toFixed(0), '≥'+(-absMax/2).toFixed(0)],
            },
            yAxis: {
                data: Object.keys(this.props.usageTrends).map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})),
            },
            series: [
            {
                name: intl.formatMessage({id:`leftovers.infographics.no-usage.trends-chart.series-name`, defaultMessage:"Доз на місяць"}),
                data: Object.values(this.props.usageTrends),
            }]
        });
    }
}

class RequiredSupplyToCoverNeedsTripleChartComponent extends React.Component {
    static contextType = IntlContext;

    state = {
        active: 3,
    };

    charts = {};

    changeActiveChart = (months) => {
        this.setState({active: months});
    }

    createChartInitializer = (months) => {
        const defaultOption = this.props.defaultOption;

        let onChartInitialized = (chart) => {
            this.charts[months] = chart;
            chart.setOption(defaultOption);

            let option = {
                textStyle: {
                    color: 'hsl(0, 0%, 96%)'
                },
                xAxis: {
                    type: 'category',
                    axisLabel: {
                        rotate: 45,
                    },
                },
                yAxis: {
                    type: 'value',
                    boundaryGap: 0,
                    splitLine: {
                        show: true,
                        lineStyle:{
                            type: [5, 10, 10, 10],
                            color: 'hsl(0, 0%, 33%)'
                        }
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    position: 'center'
                },
                grid: {
                    top: '35px',
                    left: '40px',
                    bottom: '0px',
                    right: '40px',
                },
                visualMap: {
                    min: 0,
                    max: 50000,
                    inRange: {
                        color: [
                            '#d8ffc8',
                            '#f7797c',
                        ]
                    },
                    text: [50000, '0'],
                    orient: 'vertical',
                    right: 0,
                    top: 'center',
                    textStyle: {
                        color: 'hsl(0, 0%, 96%)'
                    },
                },
            };

            chart.setOption(option);
            this.props.addNewChart(chart);
        };

        return onChartInitialized;
    }

    threeMonthInitializer = this.createChartInitializer(3);
    sixMonthInitializer = this.createChartInitializer(6);
    twelveMonthInitializer = this.createChartInitializer(12);

    isSupplied = {
        3: false,
        6: false,
        12: false
    }

    barPicture = `path://M351.564,159.286c2.414,0,4.371-1.957,4.371-4.372V73.449c0-9.381-7.017-18.914-15.974-21.703L192.168,5.702 c-7.961-2.479-20.439-2.479-28.4,0L15.973,51.746C7.017,54.535,0,64.068,0,73.449v209.073c0,9.381,7.015,18.914,15.973,21.707 l147.794,46.039c3.917,1.221,8.921,1.831,13.944,1.829c5.197,0,10.413-0.651,14.458-1.947l25.771-8.271 c2.297-0.737,2.717-2.226,2.717-5.076l-0.48-89.991c-0.015-2.406-0.117-4.817-6.365-3.846l-9.724,1.347l22.873-47.526 l23.191,39.315l-8.016,1.839c0,0-3.492,0.31-3.492,4.273c0,22.125-0.182,88.497-0.182,88.497c0,4.975,3.672,4.525,5.715,4.169 l54.205-17.486c2.067-0.667,3.041-1.598,3.041-5.592l-0.416-80.349c0-5.597-2.623-6.401-5.003-6.053l-10.312,1.503l20.614-45.019 l22.351,37.303l-9.466,1.855c-2.369,0.465-3.374,1.972-3.374,5.376v81.2c0,3.443,2.161,6.103,6.238,4.096l18.381-6.859 c8.694-3.244,15.502-13.056,15.502-22.333v-81.399c0-2.415-1.957-4.372-4.372-4.372s-4.371,1.957-4.371,4.372v81.399 c0,5.583-4.587,12.192-9.814,14.144l-12.821,4.784V228.9l7.197-1.409c2.647-0.518,4.742-2.11,5.746-4.366 c1.004-2.257,0.783-4.878-0.604-7.191l-24.906-41.562c-1.508-2.515-3.812-3.873-6.312-3.737c-2.506,0.137-4.641,1.745-5.863,4.408 l-23.433,51.185c-1.208,2.642-1.04,5.305,0.464,7.311c1.261,1.682,3.232,2.591,5.532,2.591c0.438,0,0.892-0.033,1.352-0.101 l8.549-1.251l0.392,75.272l-45.454,14.666l0.163-79.01c0,0,3.679-0.653,5.592-1.281c2.608-0.857,4.782-2.303,5.784-4.631 c0.998-2.327,0.772-5.017-0.621-7.38l-25.214-42.733c-1.528-2.587-3.844-3.987-6.432-3.897c-2.56,0.108-4.773,1.722-6.076,4.427 l-25.532,53.073c-1.3,2.703-1.181,5.439,0.328,7.51c1.276,1.752,3.315,2.701,5.713,2.701c0.436,0,0.883-0.031,1.339-0.094 l9.203-1.28l0.44,82.514l-22.402,7.188c-6.264,2.007-16.854,2.053-23.132,0.1l-147.795-46.04 c-5.235-1.634-9.829-7.874-9.829-13.361V73.449c0-5.485,4.594-11.726,9.829-13.357l147.795-46.043 c6.291-1.957,16.915-1.957,23.203,0l147.797,46.043c5.234,1.631,9.828,7.872,9.828,13.357v81.466 C347.192,157.33,349.149,159.286,351.564,159.286z"></path> <path d="M317.396,85.122l-130.271,40.583c-4.88,1.518-13.437,1.518-18.314,0L38.535,85.122c-2.305-0.72-4.756,0.565-5.473,2.873 c-0.719,2.305,0.568,4.756,2.875,5.473l130.272,40.583c3.297,1.026,7.529,1.541,11.759,1.541s8.461-0.514,11.757-1.541 l130.272-40.583c2.305-0.717,3.594-3.168,2.873-5.473C322.153,85.687,319.698,84.402,317.396,85.122z`

    render() {
        return (
            <React.Fragment>
                <p className="title is-6 has-text-centered has-text-white my-2"><FormattedMessage id="leftovers.infographics.required-supply.title" defaultMessage="Необхідний обсяг поставок вакцини (доз) для забезпечення потреб регіону на:"/></p>
                <div className="columns">
                    <div className={this.state.active == 3 ? "column active" : "column"} onClick={() => this.changeActiveChart(3)}>
                        <p className="title has-text-white"><FormattedMessage id="leftovers.infographics.required-supply.three-month" defaultMessage="Три місяці"/></p>
                        <ChartComponent
                            id="three-month-required-supply-chart"
                            onChartInitialized={this.threeMonthInitializer}
                        />
                    </div>
                    <div className={this.state.active == 6 ? "column active" : "column"} onClick={() => this.changeActiveChart(6)}>
                        <p className="title has-text-white"><FormattedMessage id="leftovers.infographics.required-supply.six-month" defaultMessage="Шість місяців"/></p>
                        <ChartComponent
                            id="six-month-required-supply-chart"
                            onChartInitialized={this.sixMonthInitializer}
                        />
                    </div>
                    <div className={this.state.active == 12 ? "column active" : "column"} onClick={() => this.changeActiveChart(12)}>
                        <p className="title has-text-white"><FormattedMessage id="leftovers.infographics.required-supply.year" defaultMessage="Рік"/></p>
                        <ChartComponent
                            id="twelve-month-required-supply-chart"
                            onChartInitialized={this.twelveMonthInitializer}
                        />
                    </div>
                </div>
            </React.Fragment>
        )
    }

    componentDidMount() {
        // Get the grandparent element
        let grandparent = document.querySelector('#section-6 .triple-chart');
        // Get the width of the grandparent element
        let width = grandparent.getBoundingClientRect().width;
        // Set the CSS variable
        grandparent.style.setProperty('--grandparent-width', width + 'px');
    }

    componentDidUpdate(prevProps, prevState) {
        const intl = this.context;
        Object.values(this.charts).forEach(chart=>chart.resize());

        const region = this.props.selectedRegion;
        const data = this.props.data[this.props.selectedRegion];
        const usage = this.props.averageUsage[this.props.selectedRegion];

        const phrases = {
            3: intl.formatMessage({id:`leftovers.infographics.required-supply.three-month-supplied`, defaultMessage:"Достатня забезпеченість\nдля покриття потреби\nна найближчі 3 місяці"}),
            6: intl.formatMessage({id:`leftovers.infographics.required-supply.six-month-supplied`, defaultMessage:"Забезпеченість достатня і для\nпокриття потреби на 6 місяців"}),
            12: intl.formatMessage({id:`leftovers.infographics.required-supply.year-supplied`, defaultMessage:"Проведений аналіз показує,\nщо потреба регіону покрита на рік"})
        };

        region == 'Україна' && (data = this.props.noFutureSuppliesForecast)
        const coverage = data.columns.reduce((acc, item, i) => {
            // Calculate the difference in month between two dates (index dates and report date)
            let index = data.data[i].findIndex(el => el == 0);
            let coverageInMonth = monthInterval(REPORT_DATE, new Date(data.index[index]));

            acc[item] = coverageInMonth;
            return acc;
        }, {});

        Object.keys(this.charts).map(months => {
            let requiredSupply = Object.keys(coverage).reduce((acc, item) => {
                let insufficiency = months - coverage[item];
                let supply = insufficiency > 0 ? Math.round(insufficiency*usage[item]) : 0;
                if (supply > 0) {
                    acc[item] = supply;
                }
                return acc;
            }, {});

            if (Object.keys(requiredSupply).length !== 0) {
                let replaceMerge = [];
                if (this.isSupplied[months]) {
                    replaceMerge = replaceMerge.concat(['graphic']);
                    this.isSupplied[months] = false;
                }

                this.charts[months].setOption({
                    xAxis: {
                        data: Object.keys(requiredSupply).map(el => intl.formatMessage({id:`direct-translation.${el}`, defaultMessage:el})),
                    },
                    series: [
                    {
                        type: 'pictorialBar',
                        symbol: this.barPicture,
                        symbolSize: 50,
                        symbolRepeat: 'fixed',
                        symbolClip: true,
                        name: intl.formatMessage({id:`leftovers.infographics.required-supply.series-name`, defaultMessage:'Доз вакцини'}),
                        data: Object.values(requiredSupply),
                    }]
                }, {replaceMerge});
            }
            else {
                let replaceMerge = [];
                if (!this.isSupplied[months]) {
                    replaceMerge = replaceMerge.concat(['series', 'xAxis']);
                    this.isSupplied[months] = true;
                }

                this.charts[months].setOption({
                    xAxis: {
                        data: [],
                    },
                    graphic: {
                        elements: [
                        {
                            type: 'text',
                            left: 'center',
                            top: 'center',
                            style: {
                            text: phrases[months],
                            fontSize: 40,
                            fontWeight: 'bold',
                            lineDash: [0, 200],
                            lineDashOffset: 0,
                            fill: 'transparent',
                            stroke: '#c8ffb2',
                            lineWidth: 1
                            },
                            keyframeAnimation: {
                            duration: 8000,
                            loop: true,
                            keyframes: [
                                {
                                percent: 0.2,
                                style: {
                                    fill: 'transparent',
                                    lineDashOffset: 200,
                                    lineDash: [200, 0]
                                }
                                },
                                {
                                // Stop for a while.
                                percent: 0.23,
                                style: {
                                    fill: 'transparent'
                                }
                                },
                                {
                                percent: 0.475,
                                style: {
                                    fill: '#c8ffb2'
                                }
                                },
                                {
                                percent: 0.525,
                                style: {
                                    fill: '#c8ffb2'
                                }
                                },
                                {
                                percent: 0.77,
                                style: {
                                    fill: 'transparent'
                                }
                                },
                                {
                                percent: 0.8,
                                style: {
                                    fill: 'transparent',
                                    lineDashOffset: 200,
                                    lineDash: [200, 0]
                                }
                                },
                                {
                                percent: 1,
                                style: {
                                    fill: 'transparent',
                                    lineDash: [0, 200],
                                    lineDashOffset: 0,
                                }
                                },
                            ]
                            }
                        }]
                    }
                }, {replaceMerge});
            }
        });
    }
}


class App extends React.Component {
    constructor(props) {
        super(props);
        const dataWithUsage = /*{}*/;

        prepareJSONedDataFrame(dataWithUsage);

        this.state = {
            dataWithUsage,
            charts: [],
            language: navigator.language.slice(0, 2), // Initial language from browser
        }
    }

    addNewChart = (chart) => {
        if (this.state.charts.find(el => el == chart)) {
            return;
        }
        this.setState(prevState => (
            {charts: [...prevState.charts, chart]}
        ));
    }

    setLanguage = (newLanguage) => this.setState({ language: newLanguage });

    messages = (locale) => {
        switch (locale) {
            case 'en':
                return enMessages;
            case 'uk':
                return ukMessages;
            case 'ru':
                return ukMessages;
            default:
                return enMessages; // Fallback to English
        }
    };      


    render() {
        const { language } = this.state;

        return (
            <IntlProvider locale={language} messages={this.messages(language)} supportedLocales={['en', 'uk']}>
                <LanguageContext.Provider value={{ language, setLanguage:this.setLanguage }}>
                    <LanguageContext.Consumer>
                        {({ language, setLanguage }) => (
                        <div>
                            <MenuComponent />
                            <HeadSectionComponent setLanguage={setLanguage} reportDate={REPORT_DATE}/>
                            <RegionalChartSectionComponent vaccineColors={this.state.vaccineColors} addNewChart={this.addNewChart} language={language}/>
                            <RegionalTextSectionComponent dataWithUsage={this.state.dataWithUsage} language={language}/>
                            <InstitutionalComponent addNewChart={this.addNewChart} language={language}/>
                            <LeftoversUsageExpirationComponent dataWithUsage={this.state.dataWithUsage} addNewChart={this.addNewChart} language={language}/>
                        </div>
                        )}
                    </LanguageContext.Consumer>
                </LanguageContext.Provider>
            </IntlProvider>
        );
    }

    componentDidMount() {
        ReactGA.initialize('G-TVYW5B1W6C');
        ReactGA.send("pageview");
        window.onresize = () => this.state.charts.forEach(el => el.resize());
    }
}

ReactDOM.render(<App />, document.getElementById('main'));