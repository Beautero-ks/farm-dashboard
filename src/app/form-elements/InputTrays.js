import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";
import {firestore} from '../../services/api/fbConfig';
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";


let today = new Date();
today.setHours(0, 0, 0, 0);
today = Math.floor(today.getTime() / 1000);
const name = localStorage.getItem('name') || '';

function InputTrays({ dashboard, pendEggs }) {
    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('Data Submitted');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const [state, setState] = useState('');
    const [rewind, setRewind] = useState(false);
    const [lastTraysDate, setLastTraysDate] = useState(0);

    useEffect(() => {
        if (pendEggs && pendEggs.length > 0) {
            const date_ = pendEggs[0].date_;
            if (date_) setLastTraysDate(date_);
        } else {
            if (dashboard) setLastTraysDate(dashboard[0].last_trays_date);
        }
    }, [dashboard, pendEggs]);

    useEffect(() => {
        if (rewind) {
            if (new Date().getTimezoneOffset() !== -180  && localStorage.getItem('name') !== 'Victor') {
                setOpen(false);
                setError("Different Timezone detected. Cannot handle input");
                setOpenError(true);
		        return -1;
            }
            firestore.doc(`trays/exact`)
                .update({
                    [today]: -1
                });
	        firestore.doc(`trays/by`)
                .update({
                    [today]: name
                });
            setOpenError(false);
            setOpenM('Value deleted');
            setOpen(true);
            setRewind(false);
        }
    }, [rewind]);

    const handleClick = (e) => {
        e.preventDefault();

        let traysOk = /^[\d]+,([0-9]|1[0-9]|2[0-9])$/.test(state);
        if (traysOk) {
            if (new Date().getTimezoneOffset() !== -180  && localStorage.getItem('name') !== 'Victor') {
                setOpen(false);
                setError("Different Timezone detected. Cannot handle input");
                setOpenError(true);
                return -1;
            }
            if (lastTraysDate !== today) {
                setOpen(false);
                setError("Enter eggs collected before trays in store");
                setOpenError(true);
                return -1;
            }
            firestore.doc(`trays/exact`)
                .update({
                    [today]: state
                });
            firestore.doc(`trays/by`)
                .update({
                    [today]: name
                });
            setOpenError(false);
            setOpenM('Data Submitted');
            setOpen(true);
        } else {
            setOpen(false);
            setError("Values not correct, retry with this format. [trayNumber,eggs]");
            setOpenError(true);
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleSelect = (e) => {
        e.preventDefault();
        setState(e.target.value.trim());
    }

    const componentDidMount = () => {
        bsCustomFileInput.init()
    }
    useEffect(() => {
        componentDidMount();
    }, []);

    if (redirect) {
        return (
            <Redirect to='/'/>
        )
    }
    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">Input Trays</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Trays</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Trays</h4>
                        <p className="card-description"> Enter trays currently in store right now after all sales have been made and eggs collected </p>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="trays">Trays</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="text" placeholder="Enter Trays and eggs" />
                            </Form.Group>
                            <button type="submit" className="btn btn-primary mr-2" onClick={handleClick}>Submit</button>
                            <button type="button" className="btn btn-dark" onClick={() => setRewind(true)}>Undo</button>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        {openM}
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="warning">
                        {openM === 'Data Submitted' ? 'Data will be updated once back online' : 'Data will be deleted once back online'}
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </div>
    )
}

const mapStateToProps = function(state) {
    return {
        dashboard: state.firestore.ordered.dashboard_data,
        pendEggs: state.firestore.ordered.pend_eggs_collected
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data', doc: 'dashboard'},
        {collection: 'pend_eggs_collected', orderBy: ['date_', 'desc']}
    ])
)(InputTrays);
