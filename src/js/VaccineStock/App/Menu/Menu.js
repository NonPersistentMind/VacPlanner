import React from 'react';
import {FormattedMessage} from 'react-intl';

import styles from './Menu.module.css';

export default function MenuComponent() {
    return (
        <div className={styles.menu}>
            <div className={styles["menu-switch"]}>
                <svg viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19 3.32001H16C14.8954 3.32001 14 4.21544 14 5.32001V8.32001C14 9.42458 14.8954 10.32 16 10.32H19C20.1046 10.32 21 9.42458 21 8.32001V5.32001C21 4.21544 20.1046 3.32001 19 3.32001Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 3.32001H5C3.89543 3.32001 3 4.21544 3 5.32001V8.32001C3 9.42458 3.89543 10.32 5 10.32H8C9.10457 10.32 10 9.42458 10 8.32001V5.32001C10 4.21544 9.10457 3.32001 8 3.32001Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M19 14.32H16C14.8954 14.32 14 15.2154 14 16.32V19.32C14 20.4246 14.8954 21.32 16 21.32H19C20.1046 21.32 21 20.4246 21 19.32V16.32C21 15.2154 20.1046 14.32 19 14.32Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 14.32H5C3.89543 14.32 3 15.2154 3 16.32V19.32C3 20.4246 3.89543 21.32 5 21.32H8C9.10457 21.32 10 20.4246 10 19.32V16.32C10 15.2154 9.10457 14.32 8 14.32Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            </div>
            <a href="#section-1" className="menu-item">
                <img src="https://i.ibb.co/HDcW50c/Designer-8.png" alt="Designer-8" border="0"/>
                <p className="title is-4 has-text-dark ml-5">
                    <FormattedMessage id="menu.regional-info" defaultMessage="Регіональна Інформація"/>
                </p>
            </a>
            <a href="#section-3" className="menu-item">
                <img src="https://i.ibb.co/P1t9YhN/Designer-1.png" alt="Designer-1" border="0"/>
                <p className="title is-4 has-text-dark ml-5">
                    <FormattedMessage id="menu.facilities-info" defaultMessage="Залишки рівня ЗОЗ"/>
                </p>
            </a>
            <a href="#section-5" className="menu-item">
                <img src="https://i.ibb.co/FgVcDDV/Designer-4.png" alt="Designer-4" border="0"/>
                <p className="title is-4 has-text-dark ml-5">
                    <FormattedMessage id="menu.stock-forecast" defaultMessage="Прогноз Залишків"/>
                </p>
            </a>
        </div>
    )
}