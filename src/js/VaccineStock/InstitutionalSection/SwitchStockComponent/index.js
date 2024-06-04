import React from 'react';
import {useState} from 'react';
import {IntlContext} from 'react-intl';
import styles from './styles.module.css';

export default function SwitchStockComponent({onChange}) {    
    const intl = React.useContext(IntlContext);

    return (
    <div class={styles["checkbox-wrapper-24"]}>
        <input type="checkbox" id="check-24" name="check" value="" onChange={onChange}/>
        <label htmlFor="check-24" className="title is-5">
            <span></span>
            {intl.formatMessage({id: `institutional.chart-section.search-bar.remove-stock`, defaultMessage: "Прибрати залишки на нацскладах?"})}
        </label>
    </div>
    )
}