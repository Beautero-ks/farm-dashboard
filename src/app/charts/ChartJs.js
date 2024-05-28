import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import moment from 'moment';
import {Line} from 'react-chartjs-2';


function ChartJs(props) {
    const { dashboard } = props;

    const [dataset, setDataset] = useState({});

    useEffect(() => {
        if (dashboard) {
            let layPercent = Array(...dashboard.laying_percent);
            layPercent.sort((a, b) => a.date - b.date);
            const xAxis = layPercent.map(o => o.date);
            const yAxis = layPercent.map(o => o.lay_percent);
            setDataset({
                labels: xAxis.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Daily Percentage',
                    data: yAxis,
                    backgroundColor: new Array(xAxis.length).fill(`rgba(11, 156, 49, 0.4)`),
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
        }
    }, [dashboard]);

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">
                    Charts
                </h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => event.preventDefault()}>Charts</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Charts</li>
                    </ol>
                </nav>
            </div>
            <h4>
                Daily Laying Percentage
            </h4>
            <div className="row">
                <div className="col-md grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body bg-white">
                            <h4 className="card-title">Daily Laying Percentage</h4>
                            <Line data={dataset} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        dashboard: state.firestore.data.dashboard
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect(() => [
        {
            collection: '0',
            doc: 'misc',
            subcollections: [
                {collection: 'dashboard', doc: 'dashboard'}
            ],
            storeAs: 'dashboard'
        }
    ])
)(ChartJs);
