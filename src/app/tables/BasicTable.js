import React, {useEffect, useState} from 'react'
import EnhancedTable from "./Table";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Form } from 'react-bootstrap';
import numeral from "numeral";
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";

function BasicTable({ pse_state, sales_state }) {
    const [hash, setHash] = useState('');
    const [state, setState] = useState('');

    const handleSelect = (val) => {
        if (val === 'None') setState('');
        else setState(val);
    }

    const handleHashChange = (e) => {
        const cleanedHash = e.target.value.replace(/\s+/g, '').replace(/(\r\n|\n|\r)/gm, '');
        setHash(cleanedHash);
    }

    return (
      <div>
          <div className="page-header">
              <h3 className="page-title">All Entries</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => event.preventDefault()}>Tables</a></li>
                  <li className="breadcrumb-item active" aria-current="page">All Entries</li>
                </ol>
              </nav>
          </div>
          <div className="row">
          <div className='col-xl grid-margin stretch-card'>
              <div className='card'>
                  <div className='card-body'>
                      <h4 className='card-title'>Sort by</h4>
                      <form className='forms-sample'>
                          <Form.Group>
                              <label htmlFor='section'>Options</label>
                              <DropdownButton
                                  alignRight
                                  title={state || 'Choose sort option'}
                                  id='dropdown-menu-align-right'
                                  onSelect={handleSelect}
                              >
                                  {optionsSort.map(item => {
                                      return item.label === 'Feeds' ? (
                                          <div>
                                              <Dropdown.Divider />
                                              <Dropdown.Item eventKey={item.label}>{item.label}</Dropdown.Item>
                                          </div>
                                      ) : <Dropdown.Item eventKey={item.label}>{item.label}</Dropdown.Item>
                                  })}
                              </DropdownButton>
                          </Form.Group>
                          <Form.Group>
                              <label htmlFor='hash'>Input specific id (64 digit code)</label>
                              <Form.Control
                                  type='text'
                                  onChange={handleHashChange}
                                  className='form-control text-white'
                                  id='hash'
                                  placeholder='Input id'
                                  value={hash}
                              />
                          </Form.Group>
                      </form>
                  </div>
              </div>
          </div>
          </div>
            <EnhancedTable to_use={state} hash={hash} />
      </div>
    )
}
const optionsSort = [
    { label: 'None'},
    { label: 'Sales' },
    { label: 'Purchases'},
    { label: 'Eggs Collected' },
    { label: 'Trades'},
    { label: 'Dead or Sick'},
    { label: 'Feeds' },
    { label: 'Pay Purity' },
    { label: 'Thika Farmers' },
    { label: 'Cakes' },
    { label: 'Duka' },
    { label: 'Other Sales' },
    { label: 'Other Purchases'},
    { label: 'Submitted by Victor'},
    { label: 'Submitted by Purity'},
    { label: 'Submitted by Babra'},
    { label: 'Submitted by Jeff'},
];

const mapStateToProps = (state) => {
    return {
        sales_state: state.firestore.data.sales,
        pse_state: state.firestore.data.purchases
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        { collection: 'sales', doc: 'state'},
        { collection: 'purchases', doc: 'state'}
    ])
)(BasicTable);

