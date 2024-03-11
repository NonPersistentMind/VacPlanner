import React from 'react';
import { IntlContext } from 'react-intl';

import styles from './styles.module.css';

export default function DropdownComponent(props) {
    const {
        filterName = "Джерело фінансування", 
        filterValues = {'Приватна':true, 'Державна':true}, 
        setFilterValue
    } = props;

    const intl = React.useContext(IntlContext);

    const [isOpened, setIsOpened] = React.useState(false);
    const displayedText = Object.keys(filterValues).filter(el => filterValues[el]).join(", ").replaceAll(/[\u0400-\u04FF]+/gi, word => intl.formatMessage({id: `foundsource.${word.toLowerCase()}`, defaultMessage: word}));

    const buttonRef = React.useRef();

    // Close dropdown when clicked outside
    React.useEffect(() => {
        function handleClickOutside(event) {
          if (buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsOpened(false);
          }
        }
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    

    return (
        <div className={styles.dropdown}>
            <p className="heading">
                {intl.formatMessage({id: `direct-translation.Фільтр`, defaultMessage: "Фільтр"})}: <b>{intl.formatMessage({id: `foundsource.filterNames.${filterName}`, defaultMessage: filterName})}</b> 
            </p>
            <hr />
            <div ref={buttonRef} className="is-relative is-flex is-flex-direction-column is-justify-content-center is-align-items-center"> 
                <button 
                    className={"button " + (isOpened ? styles["clicked"] : "")} 
                    onClick={() => setIsOpened(!isOpened)}
                >
                    {displayedText.length < 35 ? displayedText : displayedText.slice(0, 35) + "..."}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="down-arrow">
                        <g data-name="Layer 2">
                            <path d="M12 17a1.72 1.72 0 0 1-1.33-.64l-4.21-5.1a2.1 2.1 0 0 1-.26-2.21A1.76 1.76 0 0 1 7.79 8h8.42a1.76 1.76 0 0 1 1.59 1.05 2.1 2.1 0 0 1-.26 2.21l-4.21 5.1A1.72 1.72 0 0 1 12 17z" data-name="arrow-downward"></path>
                        </g>
                    </svg>
                </button>
                {
                    <div className={`${styles["dropdown-menu"]} ${(isOpened ? styles["show"] : "")}`}>
                        <ul className={styles["option-holder"]}>
                            {
                                Object.keys(filterValues).sort().map((value, index) => {
                                    return (
                                        <li key={index}>
                                            <input 
                                                checked={filterValues[value]}
                                                className={styles["checkbox-flip"]} 
                                                type="checkbox" 
                                                name={value} 
                                                id={filterName + "." + value}
                                                onChange={(e) => setFilterValue(filterName, {...filterValues, [value]: e.target.checked})}
                                            />
                                            <label className="is-5 is-bold" for={filterName + "." + value}>
                                                <span></span>
                                                {value.replaceAll(/[\u0400-\u04FF]+/gi, word => intl.formatMessage({id: `foundsource.${word.toLowerCase()}`, defaultMessage: word}))}
                                            </label>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                }
            </div>
        </div>
    )
}