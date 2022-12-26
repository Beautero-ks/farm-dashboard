import SHA256 from "crypto-js/sha256";

/**
 *
 * @param eggs
 * @returns {(function(*, *, {getFirebase: *, getFirestore: *}): void)|*}
 */
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...eggs,
            submitted_by: name,
            submitted_on: new Date()
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        delete values.date_;

        let hash = `${parseInt(values.date.getTime()/1000)}`.toUpperCase();
        hash = SHA256(hash).toString();

        firestore.collection('pend_eggs_collected').doc(hash).set({
            values
        });
        console.log('done');
    }
};
