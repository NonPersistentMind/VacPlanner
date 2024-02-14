export const clg = console.log;

export const exportToXLSX = (data, fileName = 'export.xlsx')  => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
};


export function prepareJSONedDataFrame(data, restrictZeroes = true) {
    for (let reg in data) {
        data[reg] = JSON.parse(data[reg]);
    }

    // "Transpose" an array of arrays in data
    for (let reg in data) {
        let columns = data[reg].columns;
        let index = data[reg].index;
        let values = data[reg].data;
        let new_values = [];
        for (let i = 0; i < columns.length; i++) {
            let new_value = [];
            let first = true;
            for (let j = 0; j < index.length; j++) {
                if (restrictZeroes) {
                    if (values[j][i]) {
                        new_value.push(values[j][i]);
                    }
                    else if (first) {
                        new_value.push(values[j][i]);
                        first = false;
                    }
                    else {
                        new_value.push("Закінчилась");
                    }
                }
                else {
                    new_value.push(values[j][i]);
                }
            }
            new_values.push(new_value);
        }
        data[reg].data = new_values;
        // data[reg].index = data[reg].index.map(el => new Date(el));
    }
}

export function monthInterval(d1, d2) {
    var months;
    const roundPoint = 0.1;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    months += Math.round(((d2.getDate() - d1.getDate()) / 30) / roundPoint) * roundPoint;
    return months <= 0 ? 0 : months.toFixed(1);
}

export function reverseMapping(data) {
    let result = {};

    data.forEach(item => {
        if (item !== null) {
            item.insufficientVaccines.forEach(vaccine => {
                if (!result[vaccine]) {
                    result[vaccine] = [];
                }
                result[vaccine].push(item.region);
            });
        }
    });

    return Object.keys(result).map(vaccine => ({ vaccine, regions: result[vaccine] }));
}
