/**
 *
 * @param eggs
 * @returns {(function(*, *, {getFirebase: *, getFirestore: *}): void)|*}
 */
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        let values = {
            ...eggs,
            submitted_on: new Date(),
            check_group: '0'
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        delete values.date_;

        firestore.collection('0').doc('misc').collection('pending')
        .add({
            create: true,
            values
        });
        firestore.collection("global").doc("config").collection("tasks_left").doc('0').update({
            tasks_left: firestore.FieldValue.increment(1)
        });
        console.log('done');
    }
};
