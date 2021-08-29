const cloudinary_url = "https://api.cloudinary.com/v1_1/dezblnxgl/image/upload";
const form = document.getElementById("collectionForm");

async function castom_post_req(event, file){
  event.preventDefault();
  console.log(1)
  let cloudinary = await (await cloudinaryForm(file)).json();
  let server = await serverForm(cloudinary.secure_url);
  return window.location=form.getAttribute('reload');
};

async function serverForm(url){
  const serverForm = new FormData(form);
  serverForm.set('img', url);
  let response = await fetch(form.getAttribute('action'), {method: "POST", body: serverForm});
  return response;
};

async function cloudinaryForm(file){
  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("upload_preset", "sj0wox80");
  let response = await fetch(cloudinary_url, {method: "POST", body: cloudinaryForm});
  return response;
};

if (form){
  form.addEventListener("submit", async function(event){
    let file = form.querySelector("[type=file]").files[0];
    if(file) castom_post_req(event, file);
  });
};