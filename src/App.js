import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import useSWR from "swr";
import "./index.scss";

import { Locale } from "./Locale";
import {
  TAGLINE,
  Container,
  getTodayDeleteButtonClicks,
  getDeleteButtonClicks,
} from "./Common";

function App() {
  const { data, error } = useSWR("/suspects/summary.json", (url) => {
    return fetch(url).then((r) => {
      if (!r.ok) {
        throw new Error(`${r.status} on ${url}`);
      }
      return r.json();
    });
  });
  // Better names
  const allSuspects = data || null;
  const loading = !data && !error;

  return (
    <Router>
      <div>
        <Head />
        <DeleteCounter />
        <section className="section">
          {error && (
            <Container>
              <ShowSummaryError error={error} />
            </Container>
          )}
          {!error && !data && (
            <Container>
              <h5>Loading list of locales...</h5>
            </Container>
          )}
          <Switch>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/:locale/:slug*">
              <Locale allSuspects={allSuspects} loading={loading} />
            </Route>
            <Route path="/:locale">
              <Locale allSuspects={allSuspects} loading={loading} />
            </Route>
            <Route exact path="/">
              <Home allSuspects={allSuspects} loading={loading} />
            </Route>

            <Route path="*">
              <Container>
                <NoMatch />
              </Container>
            </Route>
          </Switch>
        </section>

        <footer className="footer has-text-centered">
          <div className="container">
            <div className="columns">
              <div className="column is-8-desktop is-offset-2-desktop">
                <p>
                  <strong className="has-text-weight-semibold">
                    <Link to="/about">About this project</Link>
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

function ShowSummaryError({ error }) {
  return (
    <div className="notification is-danger is-light">
      <h3>Data loading error</h3>
      <p>An error occurred loading the summary JSON data</p>
      <pre>{error.toString()}</pre>
    </div>
  );
}

function NoMatch() {
  return (
    <Container>
      <h3>Page not found</h3>
    </Container>
  );
}

function Head() {
  let location = useLocation();
  let atHome = location.pathname === "/";
  return (
    <section
      className={atHome ? "hero is-medium is-primary" : "hero is-primary"}
    >
      <div className="hero-body">
        <div className="container">
          <div className="columns">
            <div className="column is-8-desktop is-offset-2-desktop">
              <h1 className="title is-2 is-spaced">
                Actually <i>not</i> translated on{" "}
                <a href="https://developer.mozilla.org">MDN</a>
              </h1>
              {atHome && (
                <h2 className="subtitle is-4">
                  Help us review localized content on MDN that was never fully
                  translated.
                </h2>
              )}
              {atHome ? (
                <h3 className="subtitle is-5">
                  Over the years,{" "}
                  <a href="https://developer.mozilla.org">MDN Web Docs</a>
                  ,unfortunately, accumulated a lot of localized content whose
                  translation efforts started but never finished. Now, we have
                  to get rid of these, but it’s hard to automate with
                  confidence. So that’s where you come in.
                </h3>
              ) : (
                <h3 className="subtitle is-5">
                  <Link to="/">← Go back to list of all languages</Link>
                </h3>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home({ allSuspects, loading }) {
  useEffect(() => {
    document.title = TAGLINE;
  }, []);
  if (!allSuspects) {
    return null;
  }
  return (
    <Container className="locales">
      <h2 className="title">Pick Your Locale</h2>
      {loading && <p>Loading list of locales...</p>}
      {allSuspects && !allSuspects.length && <h3>It's empty!</h3>}
      {allSuspects && allSuspects.length && (
        <ShowAllSuspects allSuspects={allSuspects} />
      )}
    </Container>
  );
}

function ShowAllSuspects({ allSuspects }) {
  let sumCount = allSuspects.reduce((a, b) => a + b.count, 0);
  let sumInception = allSuspects.reduce((a, b) => a + b.inception, 0);
  return (
    <div>
      <p>
        In total, there are <b>{sumCount.toLocaleString()}</b> document
        "suspects".
        <br />
        {sumInception !== sumCount && (
          <span>
            When it started, there were <b>{sumInception.toLocaleString()}</b>
          </span>
        )}
      </p>

      <Progressbar count={sumCount} inception={sumInception} size="medium" />
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th># Suspects</th>
          </tr>
        </thead>
        <tbody>
          {allSuspects.map((suspect) => {
            return (
              <tr key={suspect.code}>
                <td>
                  <Link to={`/${suspect.code}`}>
                    {suspect.language.English} / {suspect.language.native}
                  </Link>
                </td>
                <td>
                  <b>{suspect.count.toLocaleString()}</b> &nbsp;
                  <small title="leafs">{suspect.leafs} leafs</small>
                  <Progressbar
                    count={suspect.count}
                    inception={suspect.inception}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Progressbar({ count, inception, size = "small" }) {
  if (count > inception) {
    throw new Error("The count can't be more than the inception");
  }
  let p = Math.floor((100 * count) / inception);
  let title = `${p}% remaining (${count.toLocaleString()} left of ${inception.toLocaleString()})`;
  return (
    <progress className={`progress ${size}`} value={p} max="100" title={title}>
      {p}%
    </progress>
  );
}

function About() {
  return (
    <Container>
      <h2>About this project</h2>
      <p>
        <b>
          Code is on{" "}
          <a href="https://github.com/peterbe/mdn-nottranslated">
            github.com/peterbe/mdn-nottranslated
          </a>{" "}
          and is wide open for suggestions, bug reports, and contributions.
        </b>
      </p>
      <p>
        The intention here is to make{" "}
        <a href="https://developer.mozilla.org">MDN Web Docs</a> better by
        getting rid of unfinished and severely incomplete attempts at
        translating documents. MDN is a Wiki and to translate a page, the very
        first thing the wiki does is to <i>clone</i>
        the English (US) document and from there you can start overwriting the
        English with whatever language you’re intending to translate it to. Over
        the years, what we’ve come to discover is that a lot of these attempts
        are incomplete.{" "}
        <b>
          The document is actually <i>not</i> translated
        </b>
        . So, let’s figure out which documents are in an incomplate state so we
        can delete them and make way for newer and better translations.
      </p>

      <p style={{ textAlign: "center" }}>
        <b>
          <Link to="/">Get started by picking your language</Link>
        </b>
      </p>

      <p>
        At the moment, this web app is just for <i>highlighting</i> which
        documents are not translated. To do something about it, you need to`
        create an account on <code>wiki.developer.mozilla.org</code> and
        complete the translation. Perhaps this can change in the future.
      </p>
    </Container>
  );
}

function DeleteCounter() {
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(getTodayDeleteButtonClicks());
  let location = useLocation();

  function keyboardHandler(event) {
    if (showModal && event.code === "Escape") {
      setShowModal(false);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", keyboardHandler);
    return () => {
      document.removeEventListener("keydown", keyboardHandler);
    };
  });

  useEffect(() => {
    setCount(getTodayDeleteButtonClicks());
  }, [location.pathname]);

  if (count === null) {
    return null;
  }

  let deleteClicks = [];
  if (showModal) {
    const memory = getDeleteButtonClicks();
    const keys = Object.keys(memory);
    keys.sort();
    keys.forEach((key) => {
      deleteClicks.push({
        date: key,
        count: memory[key],
      });
    });
  }
  const title =
    'Number of times you\'ve clicked the "Start deleting on Wiki" TODAY';
  return (
    <>
      {showModal && (
        <div className="modal is-active">
          <div className="modal-background"></div>
          <div className="modal-content">
            <div className="box">
              <div className="content">
                <p>
                  <strong>
                    Today, you have clicked to delete {count} times.
                  </strong>
                  <br />
                </p>
                <p>
                  Every time you click the
                  <br />
                  <button className="button is-primary is-small" type="button">
                    Start deleting on Wiki
                  </button>
                  <br />
                  button, it increments a counter per every 24 hours.
                </p>
                {deleteClicks && (
                  <ul>
                    {deleteClicks.map((day) => {
                      return (
                        <li key={day.date}>
                          <b>{day.date}</b> <i>{day.count} clicks</i>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <button
            className="modal-close is-large"
            aria-label="close"
            onClick={(event) => {
              event.preventDefault();
              setShowModal(false);
            }}
          ></button>
        </div>
      )}

      <div
        className="box delete-counter"
        title={title}
        onClick={() => {
          setShowModal(true);
        }}
      >
        <article className="media">
          <div className="media-content">
            <h5>{count}</h5>
          </div>
        </article>
      </div>
    </>
  );
}
