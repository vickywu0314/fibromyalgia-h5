(function(){
  const U = window.FormUtils;
  const form = document.getElementById("tipiForm");
  const STORAGE_KEY = "fibromyalgia:tipiC";
  U.bind({form: form, key: STORAGE_KEY});
  form.addEventListener("submit", e => {
    e.preventDefault();
    U.save("tipi-c", U.serialize(form), STORAGE_KEY);
  });
})();
