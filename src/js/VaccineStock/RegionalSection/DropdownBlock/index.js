import React from 'react';
import styles from './styles.module.css';
import DropdownComponent from './DropdownComponent';

export default function DropdownBlockComponent() {
    return (
        <div className={styles["dropdown-block"]}>
            <DropdownComponent />
            <DropdownComponent />
            <DropdownComponent />
        </div>
    )
}