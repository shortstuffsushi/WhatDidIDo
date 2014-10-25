function repoLoaded() {
    var repoTable = document.getElementById('repo-percent-table'),
        repoData = JSON.parse(this.response);

    var firstCommitData = repoData[0];

    for (var i= 0; i < firstCommitData.contributors.length; i++) {
        var contributor = firstCommitData.contributors[i];

        var tr = document.createElement('tr'),
            gravatarTd = document.createElement('td'),
            gravatarImg = document.createElement('img'),
            emailTd = document.createElement('td'),
            numLinesTd = document.createElement('td'),
            percentTd = document.createElement('td'),
            emailHash = md5(contributor.email.trim().toLowerCase());

        gravatarImg.src = 'http://www.gravatar.com/avatar/' + emailHash;
        gravatarImg.height = gravatarImg.width = 80;

        emailTd.innerHTML = contributor.email;
        numLinesTd.innerHTML = contributor.lineCount;
        percentTd.innerHTML = Math.round(contributor.lineCount / firstCommitData.totalLines * 1000)/10+'%';

        tr.appendChild(gravatarTd);
        gravatarTd.appendChild(gravatarImg);
        tr.appendChild(emailTd);
        tr.appendChild(numLinesTd);
        tr.appendChild(percentTd);

        repoTable.appendChild(tr);
    }

    drawpie(firstCommitData);
    drawsteamgraph(repoData);
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

    // drawstuff();
}
