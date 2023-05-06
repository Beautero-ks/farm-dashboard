import SHA256 from "crypto-js/sha256";

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputPurchase = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${values.item_name}${parseInt(values.date.getTime()/1000)}${values.section}`.toUpperCase();
        hash = SHA256(hash).toString();
        values.submitted_on = new Date();
        console.log("hash to use", hash);
        
        if (JSON.parse(values.status)) {
            firestore.collection('pending_transactions')
                .doc(hash).set({
                values
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('late_payment').doc(hash).set({
                values
            });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
