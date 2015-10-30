/* global m */
(function () {
  'use strict';

  var Repo = {
    list: function() {
      return m.request({
        method: "GET",
        url: "https://api.github.com/users/jseppi/repos?sort=pushed"
      }).then(function (repos) {
        return repos.filter(function (repo) {
          return !repo.fork && repo.stargazers_count > 1;
        }).sort(function (a, b) {
          return b.stargazers_count - a.stargazers_count;
        });
      });
    }
  };

  var PopularRepos = {
    controller: function () {
      var repos = Repo.list();
      return {
        repos: repos
      };
    },

    view: function (ctrl) {
      return m("ul", [
        ctrl.repos().map(function (repo) {
          return m("li", m("a", {href: repo.html_url}, repo.name), " - " + repo.description);
        }),
      ]);
    }
  };

  m.mount(document.getElementById("repo-list"), PopularRepos);
})();
