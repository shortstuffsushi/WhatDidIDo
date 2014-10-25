function repoLoaded() {
    var repoTable = document.getElementById('repo-percent-table'),
        repoData = JSON.parse(this.response);

    for (var email in repoData.contributors) {
        var tr = document.createElement('tr'),
            gravatarTd = document.createElement('td'),
            gravatarImg = document.createElement('img'),
            emailTd = document.createElement('td'),
            numLinesTd = document.createElement('td'),
            percentTd = document.createElement('td'),
            emailHash = md5(email.trim().toLowerCase());

        gravatarImg.src = 'http://www.gravatar.com/avatar/' + emailHash;
        gravatarImg.height = gravatarImg.width = 80;

        emailTd.innerHTML = email;
        numLinesTd.innerHTML = repoData.contributors[email];
        percentTd.innerHTML = repoData.contributors[email] / repoData.totalLines * 100;

        tr.appendChild(gravatarTd);
        gravatarTd.appendChild(gravatarImg);
        tr.appendChild(emailTd);
        tr.appendChild(numLinesTd);
        tr.appendChild(percentTd);

        repoTable.appendChild(tr);
    }
}

function submit() {
    var repoNameDiv = document.getElementById('repository-name'),
        repoName = repoNameDiv.value.trim().replace(/\s?&nbsp;/g);

    if (repoName) {
        var req = new XMLHttpRequest();
        req.onload = repoLoaded;
        req.open('GET', 'http://localhost:3000/' + repoName, true);
        req.send();
    }
}
