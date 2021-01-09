import React, { useState, useEffect, createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';



// create context
const GithubContext = createContext();

// Component
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //Request Loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Error 
  const [error, setError] = useState({ show: false, msg: '' });

  //Fetch SearchUser
  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`)
      .catch((err) => console.log(err));

    if (response) {
      // User
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      // Repos and Followers
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`)
      ])
        .then(results => {
          const [repos, followers] = results;
          const status = 'fulfilled';
          if (repos.status === status) {
            setRepos(repos.value.data);

          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch(err => console.log(err));

      // Repos
      //https://api.github.com/users/john-smilga/repos?per_page=100
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`)
      //   .then(response => setRepos(response.data))
      //   .catch(err => console.log(err));

      // Followers
      // axios(`${followers_url}?per_page=100`)
      //   .then(response => setFollowers(response.data))
      //   .catch(err => console.log(err));
    } else {
      toggleError(true, 'there is no user with that username');
    }
    checkRequests();
    setIsLoading(false);
  };

  //Check Rate Limit
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining }
        } = data;
        // console.log(remaining);
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!');
        }
      })
      .catch(err => console.log(err));
  };

  // Error function
  const toggleError = (show = false, msg = '') => {
    setError({ show, msg });
  };

  useEffect(() => {

    checkRequests();
  }, []);
  return (
    <GithubContext.Provider value={ { repos, githubUser, followers, requests, error, searchGithubUser, isLoading } }>
      {children }
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };