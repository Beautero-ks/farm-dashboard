import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Redirect } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from './InputEggs';
import { inputSell } from '../../services/actions/salesAction';
import { Offline, Online } from 'react-detect-offline';
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";

function InputSell(props) {
  const { extraData } = props;

  const [state, setState] = useState({
    col_id: '7',
    date: new Date(),
    buyer: '',
    price: '350',
    units: '1',
    by: localStorage.getItem('name')?.toUpperCase() || '',
    extra_data: {info: ''}
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  const [buyer_names, setBuyerNames] = useState([]);
  const [saleType, setSaleType] = useState('Eggs');

  useEffect(() => {
    if (extraData) {
      const econs = extraData.filter(x => x.id === 'other');
      setBuyerNames(econs[0].buyer_names || []);
    }
  }, [extraData]);

  const checkDate = (date) => {
    if (date.getTime() > new Date().getTime()) {
      setError('Invalid date');
      setOpenError(true);
      return false;
    } else {
      return true;
    }
  };

  const parameterChecks = (values) => {
    const stripBuyer = values.buyer.trim().toUpperCase();
    const validNames = buyer_names.map(x => x.toUpperCase());

    if (!validNames.includes(stripBuyer)) {
      setError('Buyer name does not exist.');
      setOpenError(true);
      return false;
    }
    values.buyer = stripBuyer;

    return checkDate(values.date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const arr = Object.entries(state);
    const trayRegex = /^([0-9]+)$/;
    const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;

    if (arr.length < 5) {
      setError('All Inputs should be filled');
      setOpenError(true);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] === '' && arr[i][0] !== 'extra_data') {
        setError('All Inputs should be filled');
        setOpenError(true);
        return;
      }
      if (arr[i][0] === 'units' || arr[i][0] === 'price') {
        if (!trayRegex.test(arr[i][1])) {
          setError('Unit price and amount cannot be negative or not a number');
          setOpenError(true);
          return;
        }
      }
      if (arr[i][0] === 'info' && !alphaNumRegex.test(arr[i][1])) {
        setError('Extra info should only be letters/numbers or left empty');
        setOpenError(true);
        return;
      }
    }
    let status = true;
    if (state.not_paid) {
      status = false;
    }
    const values = {
      ...state
    };
    values.units = parseInt(values.units);
    values.price = parseInt(values.price);
    if (state.info) values.extra_data.info = state.info;

    delete values.info;
    delete values.not_paid;
    delete values.paid;
    if (!values.flock) values.subgroups = "0.0;1.0";
    delete values.flock;

    let date = new Date(values.date);
    date.setHours(0, 0, 0, 0);
    values.date = date;
    let proceed = parameterChecks(values);
    if (proceed) {
        props.inputSell(values, status);
        setOpenError(false);
        setOpen(true);
        setState({
          ...state,
          extra_data: {info: ''}
        });
    }
  };

  const handleDate = (date) => {
    setState({
      ...state,
      date: date
    });
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setOpenError(false);
  };

  const handleSelect = (e) => {
    if (e.target) {
        setState({
          ...state,
          [e.target.id]: e.target.value
        });
    } else {
      setState({
        ...state,
        buyer: e
      });
    }
  };

  const handleBuyer = (e) => {
    setState({
      ...state,
      buyer: e
    });
  }

  const handleSaleType = (e) => {
    setSaleType(e);

    setState({
      ...state,
      col_id: e === 'Other' ? '6' : '7'
    });
  }

  const componentDidMount = () => {
    bsCustomFileInput.init();
  };
  useEffect(() => {
    componentDidMount();
  }, []);

  if (redirect) {
    return <Redirect to='/' />;
  }

  return (
    <div>
      <div className='page-header'>
        <h3 className='page-title'>Input Sales</h3>
        <nav aria-label='breadcrumb'>
          <ol className='breadcrumb'>
            <li className='breadcrumb-item'>
              <a
                style={{ textDecoration: 'none' }}
                href='/'
                onClick={(event) => {
                  event.preventDefault();
                  setRedirect(true);
                }}
              >
                Home
              </a>
            </li>
            <li className='breadcrumb-item active' aria-current='page'>
              Input Sales
            </li>
          </ol>
        </nav>
      </div>
      <div className='col-xl grid-margin stretch-card overflow-auto'>
        <div className='card'>
          <div className='card-body'>
            <h4 className='card-title'>Input Sale</h4>
            <p className='card-description'> Enter sales made </p>
            <form className='forms-sample'>
              <label htmlFor='date'>Date</label>
              <Form.Group>
                <DatePicker
                  selected={state.date}
                  onChange={handleDate}
                  className="form-control text-white"
                  id='date'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='col_id'>Sale Type</label>
                <DropdownButton
                    alignRight
                    title={saleType || 'Choose Sale Type'}
                    id='col_id'
                    onSelect={handleSaleType}
                >
                  {['Eggs', 'Other'].map(x => {
                    return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                  })}
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='buyer'>Buyer Name</label>
                <DropdownButton
                    alignRight
                    title={state.buyer || 'Choose Buyer Name'}
                    id='buyer'
                    onSelect={handleBuyer}
                >
                  {Array(...buyer_names).map(x => {
                    return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                  })}
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='units'>Number of Units</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  value={state.units}
                  className="form-control text-white"
                  id='units'
                  placeholder='Number of Units'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='price'>Price per Unit</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  className="form-control text-white"
                  id='price'
                  placeholder='Price per Unit'
                  value={state.price}
                />
              </Form.Group>
              <Form.Group>
                <div className='form-check'>
                  <label htmlFor='1' className='form-check-label'>
                    <input
                      type='radio'
                      onChange={handleSelect}
                      className='form-check-input'
                      name='status'
                      id='paid'
                      defaultChecked
                      defaultValue={0}
                    />
                    <i className='input-helper' />
                    Paid
                  </label>
                </div>
                <div className='form-check'>
                  <label htmlFor='0' className='form-check-label'>
                    <input
                      type='radio'
                      onChange={handleSelect}
                      className='form-check-input'
                      name='status'
                      id='not_paid'
                      defaultValue={0}
                    />
                    <i className='input-helper' />
                    Not Paid
                  </label>
                </div>
              </Form.Group>
              <Form.Group>
                <label htmlFor="info">Extra info (optional)</label>
                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="info" placeholder="Any extra information" />
              </Form.Group>
              <button
                type='submit'
                className='btn btn-primary mr-2'
                onClick={handleSubmit}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
      <Online>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='success'>
            Data Submitted
          </Alert>
        </Snackbar>
      </Online>
      <Offline>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='warning'>
            Data will be submitted automatically when back online
          </Alert>
        </Snackbar>
      </Offline>
      <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity='error'>{error}</Alert>
      </Snackbar>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => {
  return {
    inputSell: (sale, status) => dispatch(inputSell(sale, status))
  };
};

const mapStateToProps = function(state) {
  return {
    extraData: state.firestore.ordered.extra_data
  }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
      {
        collection: '0',
        doc: 'misc',
        subcollections: [
            {collection: 'extra_data'}
        ],
        storeAs: 'extra_data'
      }
    ])
)(InputSell);
