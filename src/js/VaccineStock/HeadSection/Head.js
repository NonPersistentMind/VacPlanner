import React from "react";
import {FormattedMessage} from "react-intl"

export default class HeadSectionComponent extends React.Component {
    render() {
        return (
            <section id="head" className="hero is-fullheight">
                <div className="hero-body is-justify-content-center">
                    <div className="logo-holder is-flex is-justify-content-space-between">    
                        <img id="mhu-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Emblem_of_the_Ministry_of_Health_of_Ukraine.svg/2880px-Emblem_of_the_Ministry_of_Health_of_Ukraine.svg.png"
                        alt="" />
                        <img id="phc-logo" src="https://i.ibb.co/Z12PJJs/logo-cgz.png" alt="logo-cgz" border="0"/>
                    </div>
                    <div className="title-holder has-text-centered pb-5">
                        <p className="heading is-size-2 mb-5">
                            <b>
                                {this.props.reportType === 'Routine' ?
                                    <FormattedMessage 
                                        id="translations.head.title" 
                                        defaultMessage="Залишки вакцин для проведення профілактичних щеплень відповідно до Національного календаря"
                                    />
                                    :
                                    <FormattedMessage 
                                        id="translations.head.title.covid" 
                                        defaultMessage="Залишки вакцин для проведення щеплень від COVID-19"
                                    />
                                }
                            </b>
                        </p>
                        <p className="title is-size-3">
                            <FormattedMessage 
                                id="translations.head.report-date" 
                                defaultMessage="Звіт станом на"
                            /> {this.props.reportDate.toLocaleDateString("uk-UA")}
                        </p>
                    </div>
                    {/*<img src="https://i.ibb.co/313XX6f/Designer-2.jpg" alt="Designer-2" border="0"/>*/}
                    <img src="https://i.ibb.co/xDx1MrX/Designer.jpg" alt="Designer" border="0"/>
                </div>
            </section>
        )
    }
}
