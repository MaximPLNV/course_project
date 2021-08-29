let item_id = document.getElementsByClassName('item-id')[0].getAttribute('id');
let comments_div = document.getElementById('comments');

if (comments_div){
    setInterval(function(){
        fetch(`/comments_update?id=${item_id}`)
            .then(response => response.json())
            .then(json => {
                comments_div.innerHTML="";
                json.forEach(element => comments_div.innerHTML += getCommentHtml(element));
                if(!comments_div.innerHTML) comments_div.innerHTML += getNoCommentHtml();
            });
    },3000);
};

function getCommentHtml(element){
    return `<div class="border rounded mt-2 mb-2 p-2">
                <span class="cursor-pointer fw-bold" onclick="window.location='/user?id=${element.id}'">${element.user_name}</span><br>
                <p class="m-0"style="text-align: justify;">
                    ${element.comment}
                </p>
            </div>`;
};

function getNoCommentHtml(){
    let text = document.getElementById('nullCommentsText').innerHTML;
    return text;
};