import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useLocation
} from "react-router-dom";
import { FaLeaf, FaExclamationTriangle } from "react-icons/fa";
import "./index.scss";

const TAGLINE = "Actually not translated on MDN?";

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
                    <Route path="/about">
                      <About />
                    </Route>
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
          {allSuspects.map(suspect => {
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

function Locale({ allSuspects, loading }) {
  let [localeLoading, setLocaleLoading] = useState(false);
  let [suspects, setSuspects] = useState(null);
  let [suspectsSubset, setSuspectsSubset] = useState(null);
  let [loadingError, setLoadingError] = useState(null);
  let [seed, setSeed] = useState(Math.random());
  let [currentSuspect, setCurrentSuspect] = useState(null);
  let { locale } = useParams();

  useEffect(() => {
    let thisLocale = null;
    if (allSuspects) {
      for (let l of allSuspects) {
        if (l.code === locale) {
          thisLocale = l.language;
          break;
        }
      }
    }
    if (thisLocale) {
      document.title = `${thisLocale.English} / ${thisLocale.native} - ${TAGLINE}`;
    } else {
      document.title = `(${locale}) - ${TAGLINE}`;
    }
  }, [locale, allSuspects]);

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
        if (a.leaf === b.leaf) {
          if (Math.random() > 0.5) {
            return 1;
          } else {
            return -1;
          }
        } else if (a.leaf) {
          return -1;
        } else if (b.leaf) {
          return 1;
        } else {
          if (Math.random() > 0.5) {
            return 1;
          } else {
            return -1;
          }
        }
      });
      setSuspectsSubset(subset.slice(0, 10));
    }
  }, [suspects, seed]);

  function keyboardHandler(event) {
    if (currentSuspect) {
      if (event.code === "Escape") {
        setCurrentSuspect(null);
      } else if (event.code === "ArrowRight") {
        let index = suspectsSubset.findIndex(
          s => s.slug === currentSuspect.slug
        );
        let nextIndex = (index + 1) % suspectsSubset.length;
        setCurrentSuspect(suspectsSubset[nextIndex]);
      } else if (event.code === "ArrowLeft") {
        let index = suspectsSubset.findIndex(
          s => s.slug === currentSuspect.slug
        );
        let nextIndex = index === 0 ? suspectsSubset.length - 1 : index - 1;
        setCurrentSuspect(suspectsSubset[nextIndex]);
      }
    }
  }

  useEffect(() => {
    let dismounted = false;
    if (currentSuspect) {
      if (!currentSuspect.lastModified) {
        fetch(
          `/api/v0/about?locale=${currentSuspect.locale}&slug=${currentSuspect.slug}`
        ).then(r => {
          if (r.ok) {
            r.json().then(data => {
              if (!dismounted && data.documentData?.lastModified) {
                setCurrentSuspect(
                  Object.assign(
                    {
                      lastModified: data.documentData.lastModified
                    },
                    currentSuspect
                  )
                );
              }
            });
          }
        });
      }
    }
    return () => {
      dismounted = true;
    };
  }, [currentSuspect]);

  useEffect(() => {
    document.addEventListener("keydown", keyboardHandler);
    return () => {
      document.removeEventListener("keydown", keyboardHandler);
    };
  });

  function showPreview(suspect) {
    setCurrentSuspect(suspect);
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
      {currentSuspect && (
        <PreviewIframeModal
          suspect={currentSuspect}
          close={() => {
            setCurrentSuspect(null);
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
                showPreview(suspect);
              }}
            >
              <p className="title">{suspect.metadata.title}</p>
              <p className="subtitle">
                <LeafStatus leaf={suspect.leaf} /> {suspect.metadata.slug}
              </p>
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

function LeafStatus({ leaf }) {
  return leaf ? (
    <b title="This is a leaf node so it can easily be deleted">
      <FaLeaf color="green" />
    </b>
  ) : (
    <i title="This is not a leaf node so it can't be deleted until all its children are gone">
      <FaExclamationTriangle color="rgb(123,2,200)" />
    </i>
  );
}

function PreviewIframeModal({ suspect, close }) {
  let { metadata } = suspect;
  let title = metadata.title;

  let uri = `/${metadata.locale}/docs/${metadata.slug}`;
  let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
  let viewUrl = `https://developer.mozilla.org${uri}`;
  let sp = new URLSearchParams();
  sp.set("uri", uri);
  let src = `/api/v0/preview?${sp.toString()}`;

  let wikiUrl = "https://wiki.developer.mozilla.org" + uri;
  let deleteUrl =
    wikiUrl +
    "$delete?reason=" +
    encodeURIComponent("It was never fully translated from English.");
  return (
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            <LeafStatus leaf={suspect.leaf} />{" "}
            <a href={editUrl} target="_blank" rel="noopener noreferrer">
              Edit in Wiki
            </a>
            ,{" "}
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
              View on MDN
            </a>
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
          <div className="columns">
            <div className="column">
              <p>
                {suspect.lastModified ? (
                  <span>
                    <b>Last modified</b> {suspect.lastModified}
                  </span>
                ) : (
                  <small>fetching last modified...</small>
                )}
              </p>
            </div>
            <div className="column">
              <div className="buttons">
                <button className="button" onClick={close}>
                  Close
                </button>{" "}
                <a
                  className="button is-primary "
                  target="_blank"
                  rel="noopener noreferrer"
                  href={deleteUrl}
                >
                  Start deleting on Wiki
                </a>{" "}
              </div>
            </div>
            <div className="column">
              <small>
                Tip: You can navigate with the keyboard ⬅ and ➡ and ␛
              </small>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function About() {
  return (
    <div>
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
        documents are not translated. To do something about it, you need to
        create an account on <code>wiki.developer.mozilla.org</code> and
        complete the translation. Perhaps this can change in the future.
      </p>
    </div>
  );
}
