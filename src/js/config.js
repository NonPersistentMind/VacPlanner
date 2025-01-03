export const vaccineColors = [
    '#B66869',

    '#ffb09c',
    '#f8a83c',
    '#E7CF8D',
    '#00cd97',

    '#74ffda',
    '#4fd7ca',

    '#afd2c9',
    '#b6ff97',

    '#daffcb',
    '#12aafd',
    '#4dbffd',
    '#89d4fe',
];

export let namedVaccineColors = [
    'ІПВ',
    'АДП',
    'АДП-М',
    'АКДП',
    'БЦЖ',
    'ГепВ',
    'КПК',
    'ОПВ',
    'Пента',
    'Сказ',
    'ХІБ'
];
namedVaccineColors = namedVaccineColors.reduce((acc, name, index) => {
    acc[name] = vaccineColors[index];
    return acc;
}, {});

namedVaccineColors['Pfizer'] = '#12aafd';
namedVaccineColors['Pfizer (дитячий)'] = '#89d4fe';
namedVaccineColors['Pfizer (дитяча)'] = '#89d4fe';

export const monthMapping = {
    1: 'Січень', 
    2: 'Лютий', 
    3: 'Березень', 
    4: 'Квітень', 
    5: 'Травень', 
    6: 'Червень', 
    7: 'Липень', 
    8: 'Серпень', 
    9: 'Вересень', 
    10: 'Жовтень', 
    11: 'Листопад', 
    12: 'Грудень', 
};

export const globalOption = {
    textStyle: {
        fontFamily: 'monospace',
    },
    title: {
        textStyle: {
            fontFamily: 'monospace'
        }
    },
    legend: {
        textStyle: {
            fontFamily: 'monospace'
        }
    },
};