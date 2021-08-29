function setMainCheckBox(){
    if (document.getElementById('main_checkBox').checked){
        document.getElementById('main_checkBox').checked = false;
    };
};

function setCheckBoxes(value){
    var all_checkBoxes = document.getElementsByClassName("one-checkbox");
        for (var i=0; i<all_checkBoxes.length; i++) {
            all_checkBoxes[i].checked = value;
        };
};

function main_checkBox() {
    if (document.getElementById('main_checkBox').checked){
        setCheckBoxes(true);
    } else {
        setCheckBoxes(false);
    };
};

function getIdsCheckBoxes(){
    let ids = [];
    let checkboxes = document.getElementsByClassName("one-checkbox");
    for (checkbox in checkboxes) if (checkboxes[checkbox].checked) ids.push(checkboxes[checkbox].id);
    return ids;
};

function idsJoin(ids){
    let line;
    if (ids){
        line = "?ids[]=" + ids.join('&ids[]=');
    }
    return line ? line : null;
}

function adminPan(movement){
    let ids = getIdsCheckBoxes();
    window.location = `/${movement}${idsJoin(ids)}`;
};
