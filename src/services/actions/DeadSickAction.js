import Localbase from "localbase";

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();

        let values = {
            ...deadSick,
            submittedBy: name,
            url: '',
            file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
            submittedOn: new Date()
        }
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        const reader = new FileReader();
        const db = new Localbase('imageUpload');
        reader.addEventListener('load', () => {
            let view = new Uint8Array(reader.result);
            db.collection('dead_sick').add({
                image: view,
                file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
                time: new Date().getTime()
            }).then(() => {
                console.log("doc added to local");
                firestore.collection('pending_upload')
                    .add({ ...values });
            });
        })
        reader.readAsArrayBuffer(image);
    }
}
