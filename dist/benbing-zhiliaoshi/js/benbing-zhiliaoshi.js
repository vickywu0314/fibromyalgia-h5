    document.getElementById('backButton').addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = 'basic-info.html';
    });
