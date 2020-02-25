import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useLocation
} from "react-router-dom";
import "./index.scss";

function App() {
  let [allSuspects, setAllSuspects] = useState(null);
  let [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch("/suspects/summary.json").then(r => {
      setLoading(false);
      if (!r.ok) {
        console.error("Can't load the suspects/summary.json file!");

        throw new Error(r.statusText);
      }
      r.json().then(summary => {
        setAllSuspects(summary);
      });
    });
  }, []);

  return (
    <Router>
      <div>
        <Head />

        <section className="section">
          <div className="container">
            <div className="columns">
              <div className="column is-8-desktop is-offset-2-desktop">
                <div className="content">
                  <Switch>
                    <Route path="/:locale">
                      <Locale allSuspects={allSuspects} loading={loading} />
                    </Route>
                    <Route exact path="/">
                      <Home allSuspects={allSuspects} loading={loading} />
                    </Route>

                    <Route path="*">
                      <NoMatch />
                    </Route>
                  </Switch>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer has-text-centered">
          <div className="container">
            <div className="columns">
              <div className="column is-8-desktop is-offset-2-desktop">
                <p>
                  <strong className="has-text-weight-semibold">
                    <a href="https://www.npmjs.com/package/bulma-start">
                      bulma-start@0.0.3
                    </a>
                  </strong>
                </p>
                <p>
                  <small>
                    Source code licensed{" "}
                    <a href="http://opensource.org/licenses/mit-license.php">
                      MIT
                    </a>
                  </small>
                </p>
                <p style={{ marginTop: "1rem" }}>
                  <a href="http://bulma.io">P</a>
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

function NoMatch() {
  return <h3>Page not found</h3>;
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
                  Help us review localized MDN that was never fully translated.
                </h2>
              )}
              {atHome ? (
                <h3 className="subtitle is-5">
                  Over the years,{" "}
                  <a href="https://developer.mozilla.org">MDN Web Docs</a>
                  unfortunately has a lot of localized content whose translation
                  effort started but never finished. Now, we have to get rid of
                  these, but it's hard to automate with confidence. So that's
                  where you come in.
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
  return (
    <div>
      <h3>Pick Your Locale</h3>
      {loading && <p>Loading list of locales...</p>}
      {allSuspects && !allSuspects.length && <h3>It's empty!</h3>}
      {allSuspects && allSuspects.length && (
        <ShowAllSuspects allSuspects={allSuspects} />
      )}
    </div>
  );
}

function ShowAllSuspects({ allSuspects }) {
  return (
    <table className="table is-fullwidth">
      <thead>
        <tr>
          <th>Name</th>
          <th># Suspects</th>
        </tr>
      </thead>
      <tbody>
        {allSuspects.map(suspect => {
          return (
            <tr key={suspect.code}>
              <td>
                <Link to={`/${suspect.code}`}>
                  {suspect.language.English} / {suspect.language.native}
                </Link>
              </td>
              <td>
                <b>{suspect.count}</b>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Locale({ allSuspects, loading }) {
  let [localeLoading, setLocaleLoading] = useState(false);
  let [suspects, setSuspects] = useState(null);
  let [suspectsSubset, setSuspectsSubset] = useState(null);
  let [loadingError, setLoadingError] = useState(null);
  let [seed, setSeed] = useState(Math.random());
  let { locale } = useParams();
  useEffect(() => {
    if (!loading) {
      if (allSuspects) {
        setLocaleLoading(true);
        fetch(`/suspects/${locale}.json`)
          .then(r => {
            setLocaleLoading(false);
            if (!r.ok) {
              throw new Error(r.statusText);
            }

            r.json().then(documents => {
              setSuspects(documents);
            });
          })
          .catch(er => {
            setLoadingError(er.toString());
          });
      }
    }
  }, [loading, allSuspects, locale]);

  useEffect(() => {
    if (suspects) {
      let subset = [...suspects];
      subset.sort((a, b) => {
        if (Math.random() > 0.5) {
          return 1;
        } else {
          return -1;
        }
      });
      setSuspectsSubset(subset.slice(0, 10));
    }
  }, [suspects, seed]);

  let [modalSrc, setModalSrc] = useState(null);
  let [modalTitle, setModalTitle] = useState(null);

  function showPreview(metadata) {
    // console.log("SHOW PREVIEW:", metadata);
    setModalTitle(metadata.title);
    let uri = `/${metadata.locale}/docs/${metadata.slug}`;
    let sp = new URLSearchParams();
    sp.set("uri", uri);
    let viewUrl = `/api/v0/preview?${sp.toString()}`;
    // console.log("MODAL URL:", viewUrl);
    setModalSrc(viewUrl);
  }

  let thisLocale = null;
  if (allSuspects) {
    for (let l of allSuspects) {
      if (l.code === locale) {
        thisLocale = l;
      }
    }
  }
  return (
    <div>
      {thisLocale && (
        <h1 className="title">
          {thisLocale.language.English} / {thisLocale.language.native}
        </h1>
      )}
      <h2 className="subtitle">{locale}</h2>
      {loadingError && <h4>Loading error; {loadingError}</h4>}

      {(loading || localeLoading) && !loadingError && <p>Loading...</p>}
      {!(loading || localeLoading) && suspects && suspectsSubset && (
        <ShowSuspects
          suspects={suspects}
          subset={suspectsSubset}
          showPreview={showPreview}
          refreshSubset={() => {
            setSeed(Math.random());
          }}
        />
      )}
      {modalSrc && (
        <PreviewIframeModal
          src={modalSrc}
          title={modalTitle}
          close={() => {
            setModalSrc(null);
            setModalTitle(null);
          }}
        />
      )}
    </div>
  );
}

function ShowSuspects({ suspects, subset, showPreview, refreshSubset }) {
  return (
    <div>
      <h3>There are {suspects.length} suspects in this locale</h3>
      <p>
        Showing you 10 randomly selected ones.
        <br />
        Review one at a time and ask yourself{" "}
        <i>"Is this page still mostly all English?"</i>
      </p>
      {suspects.length > subset.length && (
        <p>
          <button className="button" type="button" onClick={refreshSubset}>
            Refresh subset
          </button>
        </p>
      )}
      {subset.map(suspect => {
        let uri = `/${suspect.metadata.locale}/docs/${suspect.metadata.slug}`;
        let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
        let viewUrl = `https://developer.mozilla.org${uri}`;
        return (
          <div
            className="card"
            key={suspect.metadata.slug}
            style={{ marginBottom: 30 }}
          >
            <div
              className="card-content"
              onClick={e => {
                e.preventDefault();
                showPreview(suspect.metadata);
              }}
            >
              <p className="title">{suspect.metadata.title}</p>
              <p className="subtitle">{suspect.metadata.slug}</p>
            </div>
            <footer className="card-footer">
              <p className="card-footer-item">
                <span>
                  <a href={editUrl} target="_blank" rel="noopener noreferrer">
                    Edit in Wiki
                  </a>
                </span>
              </p>
              <p className="card-footer-item">
                <span>
                  <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                    View on MDN
                  </a>
                </span>
              </p>
            </footer>
          </div>
        );
      })}
    </div>
  );
}

// function PreviewIframeModal({ src, title, close }) {
//   return (
//     <div className="modal is-active">
//       <div className="modal-background"></div>
//       <div className="modal-content">
//         <iframe src={src} title={title} width={1200} height={800}></iframe>
//       </div>
//       <button
//         className="modal-close is-large"
//         aria-label="close"
//         onClick={close}
//       ></button>
//     </div>
//   );
// }
function PreviewIframeModal({ src, title, close }) {
  return (
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            Preview <code>{title}</code>
          </p>
          <button
            className="delete"
            aria-label="close"
            onClick={close}
          ></button>
        </header>
        <section className="modal-card-body">
          <iframe src={src} title={title} width={1200} height={800}></iframe>
        </section>
        <footer className="modal-card-foot">
          {/* <button className="button is-success">Save changes</button> */}
          <button className="button" onClick={close}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
