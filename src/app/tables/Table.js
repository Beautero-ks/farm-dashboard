import React, {useEffect, useMemo, useState} from 'react';
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
import {firestore} from "../../services/api/fbConfig";

function createData(name, date, subm, hash) {
    return {
        name,
        date,
        subm,
        hash,
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
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } =
        props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all entries',
                        }}
                    />
                </TableCell>
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
    onSelectAllClick: PropTypes.func.isRequired,
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
                    <IconButton disabled={disable}  onClick={() => {
                        setDisable(true);
                        let user = localStorage.getItem('name');

                        const pushDelete = async () => {
                            let wasEntered  = await firestore.collection('to_delete').doc('to_delete').get();
                            wasEntered = wasEntered.data();
                            let foundUser = false;

                            for (const x of idsSelected) {
                                const prevVal = await firestore.collection('tx_ui')
                                    .doc(x).get();

                                for (const val of Object.keys(wasEntered)) {
                                    if (val === user) {
                                        foundUser = true;
                                        for (const sel of wasEntered[user]) {
                                            if (sel === x) {
                                                window.alert(`You have already marked selected entry`);
                                                console.log(sel, 'remarked');
                                                return;
                                            }
                                        }
                                        const newVals = [...wasEntered[user]];
                                        newVals.push(x);
                                        await firestore.collection('tx_ui')
                                            .doc(x).update({
                                                status: parseInt(prevVal.data().status) + 1
                                            });
                                        await firestore.collection('to_delete').doc('to_delete')
                                            .update({
                                                [user]: newVals
                                            });
                                    }
                                }

                                if (!foundUser) {
                                    await firestore.collection('tx_ui')
                                        .doc(x).update({
                                            status: parseInt(prevVal.data().status) + 1
                                        });
                                }
                            }

                            if (!foundUser) {
                                await firestore.collection('to_delete').doc('to_delete')
                                    .update({
                                        [user]: idsSelected
                                    });
                            }
                            window.alert(`${numSelected} entries have been marked for deletion. Will be deleted when at least 3 users mark the same`);
                            window.location.reload();
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

const getFieldName = (to_use) => {
    if (to_use === 'Sales' || to_use === 'Purchases' || to_use === 'Eggs Collected'
    || to_use === 'Trades' || to_use === 'Dead or Sick') return ['col', `${(to_use === 'sales' || to_use === 'purchases' || to_use === 'trades') ? to_use.slice(0, to_use.length-1) : to_use}`]
    if (to_use.startsWith('Submitted by ')) return ['by', `${to_use.slice(13, to_use.length).toUpperCase()}`];
    return ['data.section', `${to_use === 'Pay Purity' ? 'LABOUR' : to_use === 'Other Sales' ? 'SOTHER' : to_use === 'Other Purchases' ? 'POTHER' : to_use === 'Thika Farmers' ? 'THIKA FARMERS' : to_use.toUpperCase() }`]
}

let isRun = false;

function EnhancedTable(props) {
    const { tx_ui, to_use, hash, firestore, extra_data } = props;

    const [order, setOrder] = useState('desc');
    const [txs, setTxs] = useState({});
    const [txWatch, setTxWatch] = useState([]);
    const [orderBy, setOrderBy] = useState('data.date.unix');
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [dense, setDense] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [rows, setRows] = useState([]);
    const [allDone, setAllDone] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [indexerChanged, setIndexerChanged] = useState(false);
    const orderBy_ = `${(orderBy === 'data.date.unix' || orderBy === 'data.entry_hash') ? orderBy : orderBy === 'subm' ? 'data.submitted_on' : null}`;

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
        }
    }, [tx_ui]);

    useEffect(() => {
        let isSubscribed = true;
        const is_valid_hash = /^[a-f0-9]{64}$/.test(hash);

        // declare the async data fetching function
        const fetchData = async (num) => {
            const limit = num+txWatch.length;

            // get the data
            let dataDocs;
            if (is_valid_hash) {
                dataDocs = await firestore.get({collection: 'tx_ui', where: ['data.hash', '==', hash]});
            } else if (to_use === '') {
                dataDocs = await firestore.get({collection: 'tx_ui', limit, orderBy: [orderBy_, order]});
            } else {
                const field = getFieldName(to_use)[0];
                if (field === orderBy_) {
                    console.log('same rows', field);
                    dataDocs = await firestore.get({
                        collection: 'tx_ui',
                        limit,
                        where: [getFieldName(to_use)[0], '==', getFieldName(to_use)[1]]
                    });
                } else {
                    console.log('not same rows', field, orderBy_);
                    dataDocs = await firestore.get({
                        collection: 'tx_ui',
                        limit,
                        where: [getFieldName(to_use)[0], '==', getFieldName(to_use)[1]],
                        orderBy: [orderBy_, order]
                    });
                }
            }

            // set state with the result if `isSubscribed` is true
            if(isSubscribed) {
                console.log("check1", dataDocs.size, limit);
                if (is_valid_hash) setAllDone(true);
                else if (dataDocs.size < limit) setAllDone(true);
            }
        }

        // call the function
        //console.log("diff", rows.length, rowsPerPage)

        if (is_valid_hash && !allDone) {
            console.log("hash ok");
            if (tx_ui.length === 1 && tx_ui[0].data.entry_hash === hash) {
                setAllDone(true);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            fetchData()
                .catch(console.error);

        } else if ((rows.length <= rowsPerPage && !allDone) || indexerChanged) {
            console.log('row change');
            setIsLoading(true);
            setIndexerChanged(false);
            fetchData((rowsPerPage-rows.length)+1)
                .catch(console.error);

        } else if (rows.length <= ((page+1)*rowsPerPage) && !allDone) {
            console.log('page change');
            setIsLoading(true);
            fetchData(((page+1)*rowsPerPage-rows.length)+1)
                .catch(console.error);

        } else if (allDone) {
            console.log("ALL DATA RETRIEVED", txWatch.length);
            setIsLoading(false);

        } else {
            //console.log("OK");
            setIsLoading(false);
        }

        // cancel any future `setData`
        return () => isSubscribed = false;

        // eslint-disable-next-line
    }, [rowsPerPage, rows, page, to_use, hash]);

    useEffect(() => {
        if (orderBy === 'data.date.unix' && order === 'desc') isRun = false;
        // eslint-disable-next-line
    }, [order]);

    useEffect(() => {
        let isSubscribed = true;
        const is_valid_hash = /^[a-f0-9]{64}$/.test(hash);

        // declare the async data fetching function
        const fetchData = async () => {
            console.log("stopped", txWatch.length <= 6 && orderBy === 'data.date.unix' && order === 'desc')
            if (txWatch.length <= 6 && orderBy === 'data.date.unix' && order === 'desc' && isRun) return;
            isRun = true;
            const limit = txWatch.length;

            // get the data
            let dataDocs;
            if (to_use === '') dataDocs = await firestore.get({ collection: 'tx_ui', limit, orderBy: [orderBy_, order] });
            else {
                const field = getFieldName(to_use)[0];
                if (field === orderBy_) {
                    console.log('same', field);
                    dataDocs = await firestore.get({
                        collection: 'tx_ui',
                        limit,
                        orderBy: [orderBy_, order]
                    });
                } else {
                    console.log('not same', field, orderBy_);
                    dataDocs = await firestore.get({
                        collection: 'tx_ui',
                        limit,
                        where: [getFieldName(to_use)[0], '==', getFieldName(to_use)[1]],
                        orderBy: [orderBy_, order]
                    });
                }
            }

            if (isSubscribed) {
                console.log("CHECK2", dataDocs.size, limit);
                if (dataDocs.size < limit) setAllDone(true);
            }
        }

        // call the function
        if (is_valid_hash) {
            console.log("order while hash is true");
            setIsLoading(false);
            return;
        } else if (!allDone) {
            setIsLoading(true);
            fetchData()
                // make sure to catch any error
                .catch(console.error);
        } else {
            console.log("ALL DATA RETRIEVED", txWatch.length);
            setIsLoading(false);
        }

        // cancel any future `setData`
        return () => isSubscribed = false;

        // eslint-disable-next-line
    }, [order, orderBy]);

    useMemo(() => {
        const temp = []
        let local_txs = {}
        let action;
        if (to_use === 'Sales') {
            action = 'sales';
        } else if (to_use === 'Trades') {
            action = 'trades';

        } else if (to_use === 'Purchases') {
            action = 'purchases';
        } else {
            action = to_use
        }
        const is_valid_hash = /^[a-f0-9]{64}$/.test(hash);

        for(let tx of Object.entries(txWatch)) {
            tx = tx[1];
            local_txs = {
                ...local_txs,
                [tx.data.entry_hash]: tx
            };
            if (is_valid_hash) {
                if (tx.data.entry_hash === hash) {
                    temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                    setPage(0);
                }
            }
            else if (tx.col !== 'trades') {
                if (action === '') {
                    temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                }
                else if (action === 'Submitted by Victor' && tx.data.by === 'VICTOR') temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                else if (action === 'Submitted by Jeff' && tx.data.by === 'JEFF') temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                else if (action === 'Submitted by Purity' && tx.data.by === 'PURITY') temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                else if (action === 'Submitted by Babra' && tx.data.by === 'BABRA') temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                else if (action === tx.col) {
                    temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
                }
            }
            else if (tx.col === 'trades') {
                if (JSON.stringify(tx.data.links) === '{}') temp.push(createData(tx.col, tx.data.date.unix, tx.data.submitted_on.unix, tx.data.entry_hash));
            }
        }
        setTxs(local_txs);
        setRows(temp);

    }, [to_use, hash, txWatch]);

    useMemo(() => {
        setAllDone(false);
        setIndexerChanged(true);

        // eslint-disable-next-line
    }, [to_use]);

    useMemo(() => {
        setAllDone(false);

        // eslint-disable-next-line
    }, [hash]);

    useMemo(() => {
        setPage(Math.floor(rows.length / rowsPerPage) < page ? Math.floor(rows.length / rowsPerPage) : page);

        // eslint-disable-next-line
    }, [rows.length]);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n) => n.hash);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, name) => {
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
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {/* if you don't need to support IE11, you can replace the `stableSort` call with:
                 rows.slice().sort(getComparator(order, orderBy)) */}
                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const isItemSelected = isSelected(row.hash);
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    const data = txs[row.hash]?.data;

                                    let from;
                                    let to;
                                    if (row.name === 'trades') {
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
                                    const toPrint = row.name === 'eggs_collected' ? `flock: ${parseInt(data.subgroups.split('::')[0])+1} (${by}) trays ${data.trays_collected}`
                                        : row.name === 'dead_sick'
                                            ? `(${by}) ${numeral(data.number).format(',')} ${data.state.toLowerCase()}`
                                            : row.name === 'sales' ? `(${by}) to ${data.buyer.toLowerCase()} ${numeral(data.units).format(',')}@${numeral(data.price).format(',')}`
                                                : row.name === 'purchases' ? `(${by}) ${data.item_name.toLowerCase()} ${data.extra_data.bag_weight ? data.extra_data.bag_weight+' ' : ''}${data.extra_data.vendor?.toLowerCase() ? data.extra_data.vendor?.toLowerCase()+' ' : ''}${numeral(data.units).format(',')}@${numeral(data.price).format(',')}`
                                                    : row.name === 'trades' ? `from ${from} to ${to}` : '';

                                    return (
                                        <TableRow
                                            hover
                                            onClick={(event) => handleClick(event, row.hash)}
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
                                                {row.name.split('_').join(' ')} {toPrint}
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
            {selected.map((item, index) => {
                const type = txs[item].col;

                if (type === 'eggs_collected') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].data.date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            Collected {txs[item].data.trays_collected.split(',')[0]} tray(s) and {txs[item].data.trays_collected.split(',')[1]} egg(s)
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {JSON.stringify(txs[item].data)}
                                            Broken: {txs[item].data.broken}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].data.by.toLowerCase()}
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
                else if (type === 'trades') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].data.date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {JSON.stringify(txs[item].data.links) === '{}' ? 'Physical Trade' : `Tied to the ${JSON.stringify(txs[item].data.links)}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            From: {txs[item].data.from.toLowerCase()}
                                            <br />
                                            To: {txs[item].data.to.toLowerCase()}
                                            <br />
                                            Amount traded: Ksh. {Number.isInteger(txs[item].data.amount) ? numeral(txs[item].data.amount).format("0,0") : numeral(txs[item].data.amount).format("0,0.00")}
                                            <br />
                                            {JSON.stringify(txs[item].data.extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].data.by.toLowerCase()}
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
                else if (type === 'sales') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].data.date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {txs[item].data.buyer.toLowerCase()}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].data.units).format("0,0")} Tray(s) at Ksh. {numeral(txs[item].data.price).format("0,0")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].data.by.toLowerCase()}
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
                else if (type === 'purchases') {
                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Date: {txs[item].data.date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {`${txs[item].data.section.toLowerCase() === 'pother' ? 'other,' : txs[item].data.section.toLowerCase() === 'ppurity' ? 'Purity:' : txs[item].data.section.toLowerCase()+','} ${txs[item].data.item_name.toLowerCase()}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].data.units).format("0,0")} Item(s) at Ksh. {numeral(txs[item].data.price).format("0,0")}
                                            <br />
                                            {JSON.stringify(txs[item].data.extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].data.by.toLowerCase()}
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
                else if (type === 'dead_sick') {
                    let val = extra_data.extra_data.subgroups[txs[item].data.subgroups];

                    return (
                        <div key={index}>
                            <Card variant="outlined">
                                <React.Fragment>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            {txs[item].data.state.toLowerCase()}
                                            <br />
                                            Date: {txs[item].data.date.locale.slice(0,20)}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {`${txs[item].data.state.toLowerCase()}, ${val}`}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                            {numeral(txs[item].data.number).format("0,0")} {txs[item].data.state.toLowerCase()}
                                            <br />
                                            {txs[item].data.reason.toLowerCase()}
                                            <br />
                                            {JSON.stringify(txs[item].data.extra_data)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Submitted by {txs[item].data.by.toLowerCase()}
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
        tx_ui: state.firestore.ordered.tx_ui,
        extra_data: state.firestore.data.extra_data
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        { collection: 'tx_ui', orderBy: ['data.date.unix', 'desc'], limit: 6 },
        { collection: 'extra_data', doc: 'extra_data' }
    ])
)(EnhancedTable);
