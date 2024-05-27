import React, {useMemo, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import moment from 'moment';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import { alpha } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { BrowserView, MobileView } from 'react-device-detect';
import {firestore} from '../../services/api/firebaseConfig';


const __user__ = localStorage.getItem('name')?.toUpperCase() || '';
const col_names = {"1": "Sale", "2": "Expense", "3": "Dead/Sick", "4": "Eggs", "5": "Trades"}

function createData(col_id, name, date, subm, hash, subg) {
    return {
        col_id,
        name,
        date,
        subm,
        hash,
        subg
    };
}

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) {
            return order;
        }
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const headCells = [
    {
        id: 'type',
        numeric: false,
        disablePadding: true,
        label: 'Type',
    },
    {
        id: 'date',
        numeric: true,
        disablePadding: false,
        label: 'Date',
    },
    {
        id: 'subm',
        numeric: true,
        disablePadding: false,
        label: 'Submitted On',
    }
];

function EnhancedTableHead(props) {
    const { order, orderBy, onRequestSort } =
        props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell />
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const EnhancedTableToolbar = (props) => {
    const { numSelected, idsSelected } = props;
    const [disable, setDisable] = useState(false);

    return (
        <Toolbar
            sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                    bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }),
            }}
        >
            {numSelected > 0 ? (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    color="inherit"
                    variant="subtitle1"
                    component="div"
                >
                    {numSelected} selected
                </Typography>
            ) : (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    variant="h6"
                    id="tableTitle"
                    component="div"
                >
                    Entries
                </Typography>
            )}

            {numSelected > 0 ? (
                <Tooltip title="Delete">
                    <IconButton disabled={disable} onClick={() => {
                        setDisable(true);
                        const pushDelete = async () => {
                            console.log("NUM:", idsSelected.length);
                            for (const x of idsSelected) {
                                const x_split = x.split('!!');
                                await firestore.collection('0').doc('misc').collection('pending').add({
                                    create: false,
                                    values: {
                                        check_group: '0',
                                        by: __user__,
                                        entry_hash: x_split[1],
                                        col_id: x_split[0],
                                        subgroups: x_split[2],
                                        submitted_on: new Date(),
                                        date: new Date(0)
                                    }
                                });
                                firestore.collection("global").doc("config").collection("tasks_left").doc('0').update({
                                    tasks_left: firestore.FieldValue.increment(1)
                                });

                            }
                            window.alert(`Selected entr${idsSelected.length === 1 ? 'y' : 'ies'} will be deleted`);
                            setDisable(false);
                        }
                        pushDelete();
                    }}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Filter list">
                    <IconButton>
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
            )}
        </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    idsSelected: PropTypes.array.isRequired
};

function EnhancedTable(props) {
    const { tx_ui, extra_data } = props;

    const [order, setOrder] = useState('desc');
    const [txs, setTxs] = useState({});
    const [txWatch, setTxWatch] = useState([]);
    const [orderBy, setOrderBy] = useState('date.unix');
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [dense, setDense] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useMemo(() => {
        if (tx_ui) {
            if (tx_ui.length === 0) {
                setIsLoading(false);
                return;
            }
            const data = [];
            for (const tx of tx_ui) {
                data.push(tx);
            }
            setTxWatch(data);
            setIsLoading(false);
        }
    }, [tx_ui]);

    useMemo(() => {
        const temp = []
        let local_txs = {}

        for(let tx of Object.entries(txWatch)) {
            tx = tx[1];
            local_txs = {
                ...local_txs,
                [tx.entry_hash]: tx
            };
            if (tx.col !== 'trades') {
                temp.push(createData(tx.col_id, tx.col, tx.date.unix, tx.submitted_on.unix, tx.entry_hash, tx.subgroups));
            }
            else if (tx.col === 'trades') {
                if (JSON.stringify(tx.links) === '{}') temp.push(createData(tx.col_id, tx.col, tx.date.unix, tx.submitted_on.unix, tx.entry_hash, tx.subgroups));
            }
        }
        setTxs(local_txs);
        setRows(temp);

    }, [txWatch]);

    useMemo(() => {
        setPage(Math.floor(rows.length / rowsPerPage) < page ? Math.floor(rows.length / rowsPerPage) : page);

        // eslint-disable-next-line
    }, [rows.length]);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleClick = (event, row_) => {
        const name = `${row_.col_id}!!${row_.hash}!!${row_.subg}`;

        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        console.log("page prev", page, newPage);
        setPage((rows.length / rowsPerPage) > 1 ? newPage : page);
    };

    const handleChangeRowsPerPage = (event) => {
        const numEntries = parseInt(event.target.value, 10);
        let predictedPage = rows.length >= (page*rowsPerPage)+1 ? (page*rowsPerPage)+1 : rows.length - 1;
        const rem = predictedPage % numEntries;

        predictedPage = rem === 0 ? (predictedPage / numEntries) - 1 : Math.floor(predictedPage / numEntries);

        setRowsPerPage(numEntries);
        setPage(Math.floor(rows.length / numEntries) < page ? predictedPage : page);
    };

    const handleChangeDense = (event) => {
        setDense(event.target.checked);
    };

    const isSelected = (name) => selected.indexOf(name) !== -1;
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    if (!extra_data) return <div />

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2 }}>
                <EnhancedTableToolbar numSelected={selected.length} idsSelected={selected} />
                <TableContainer>
                    <Table
                        sx={{ minWidth: 1 }}
                        aria-labelledby="tableTitle"
                        size={dense ? 'small' : 'medium'}
                    >
                        <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {/* if you don't need to support IE11, you can replace the `stableSort` call with:
                 rows.slice().sort(getComparator(order, orderBy)) */}
                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const isItemSelected = isSelected(`${row.col_id}!!${row.hash}!!${row.subg}`);
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    const data = txs[row.hash];

                                    let from;
                                    let to;
                                    if (row.col_id === '5') {
                                        from = data.from.toLowerCase();
                                        to = data.to.toLowerCase();
                                        from = from.split('_');
                                        to = to.split('_');
                                        if (from.length > 1) from = from.join(' ');
                                        else from = from[0];
                                        if (to.length > 1) to = to.join(' ');
                                        else to = to[0];
                                    }

                                    const by = data.by.toLowerCase();
                                    const toPrint = row.col_id === '4' ? `flock: ${parseInt(data.subgroups.split('.')[0])+1} (${by}) trays ${data.trays_collected} [${row.hash.slice(0, 4)}]`
                                        : row.col_id === '3'
                                            ? `(${by}) ${numeral(data.number).format(',')} ${data.state.toLowerCase()} [${row.hash.slice(0, 4)}]`
                                            : row.col_id === '1' ? `(${by}) to ${data.buyer.toLowerCase()} ${numeral(data.units).format(',')}@${numeral(data.price).format(',')} [${row.hash.slice(0, 4)}]`
                                                : (row.col_id === '2' || row.col_id === 'expenses') ? `(${by}) ${data.item_name.toLowerCase()} ${data.extra_data.bag_weight ? data.extra_data.bag_weight+' ' : ''}${data.extra_data.vendor?.toLowerCase() ? data.extra_data.vendor?.toLowerCase()+' ' : ''}${numeral(data.units).format(',')}@${numeral(data.price).format(',')} [${row.hash.slice(0, 4)}]`
                                                    : row.col_id === '5' ? `from ${from} to ${to} [${row.hash.slice(0, 4)}]` : row.col_id === '6' ? `(${by}) to ${data.buyer.toLowerCase()} ${numeral(data.units).format(',')}@${numeral(data.price).format(',')} [${row.hash.slice(0, 4)}]` : '';

                                    return (
                                        <TableRow
                                            hover
                                            onClick={(event) => handleClick(event, row)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.hash}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    inputProps={{
                                                        'aria-labelledby': labelId,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                component="th"
                                                id={labelId}
                                                scope="row"
                                                padding="none"
                                            >
                                                {col_names[row.col_id]} {toPrint}
                                            </TableCell>
                                            <TableCell align="right">{moment.unix(row.date).format("ddd ll")}</TableCell>
                                            <TableCell align="right">{moment.unix(row.subm).format("ddd ll")}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow
                                    style={{
                                        height: (dense ? 33 : 53) * emptyRows,
                                    }}
                                >
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <BrowserView>
                    <TablePagination
                        rowsPerPageOptions={[5, 15, 25]}
                        component="div"
                        showFirstButton={true}
                        showLastButton={true}
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </BrowserView>
                <MobileView>
                    <TablePagination
                        rowsPerPageOptions={[]}
                        component="div"
                        showFirstButton={true}
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </MobileView>
                { isLoading && <LinearProgress color="secondary"/> }
            </Paper>
            <FormControlLabel
                control={<Switch checked={dense} onChange={handleChangeDense} />}
                label="Dense padding"
            />
            {selected.map((item_, index) => {
                const item = item_.split('!!')[1]
                const type = txs[item].col_id;

                if (type === '4') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            Collected {txs[item].trays_collected.split(',')[0]} tray(s) and {txs[item].trays_collected.split(',')[1]} egg(s)
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {JSON.stringify(txs[item])}
                                            Broken: {txs[item].broken}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                }
                else if (type === '5') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {JSON.stringify(txs[item].links) === '{}' ? 'Physical Trade' : `Tied to the ${JSON.stringify(txs[item].links)}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            From: {txs[item].from.toLowerCase()}
                                            <br />
                                            To: {txs[item].to.toLowerCase()}
                                            <br />
                                            Amount traded: Ksh. {Number.isInteger(txs[item].amount) ? numeral(txs[item].amount).format("0,0") : numeral(txs[item].amount).format("0,0.00")}
                                            <br />
                                            {JSON.stringify(txs[item].extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                }
                else if (type === '1') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {txs[item].buyer.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].units).format("0,0")} Tray(s) at Ksh. {numeral(txs[item].price).format("0,0")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                }
                else if (type === '2') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {`${txs[item].section.toLowerCase() === 'pother' ? 'other,' : txs[item].section.toLowerCase() === 'ppurity' ? 'Purity:' : txs[item].section.toLowerCase()+','} ${txs[item].item_name.toLowerCase()}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].units).format("0,0")} Item(s) at Ksh. {numeral(txs[item].price).format("0,0")}
                                            <br />
                                            {JSON.stringify(txs[item].extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                }
                else if (type === '3') {
                    const econs = extra_data.constants;
                    let val = econs.all_subgroups[txs[item].subgroups];

                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            {txs[item].state.toLowerCase()}
                                            <br />
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {`${txs[item].state.toLowerCase()}, ${val}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].number).format("0,0")} {txs[item].state.toLowerCase()}
                                            <br />
                                            {txs[item].reason.toLowerCase()}
                                            <br />
                                            {JSON.stringify(txs[item].extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                } else if (type === '6') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {txs[item].buyer.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].units).format("0,0")} Units(s) at Ksh. {numeral(txs[item].price).format("0,0")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].by.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            id: {item.slice(0, 32)}<br />
                                            {item.slice(32)}
                                        </Typography>
                                    </CardContent>
                                </React.Fragment>
                            </Card>
                            <br />
                        </div>
                    )
                }
                return <div key={-6} />
            })}
        </Box>
    );
}

const mapStateToProps = (state) => {
    return {
        tx_ui: state.firestore.ordered.txs,
        extra_data: state.firestore.data.extra_data

    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {
            collection: '0',
            doc: 'misc',
            subcollections: [
                { collection: 'txs', where: ['check_group', '==', '0'], orderBy: ['date.unix', 'desc'], limit: 100}
            ],
            storeAs: 'txs'
        },
        {
            collection: '0',
            doc: 'misc',
            subcollections: [
                {collection: 'extra_data'}
            ],
            storeAs: 'extra_data'
        }
    ])
)(EnhancedTable);
