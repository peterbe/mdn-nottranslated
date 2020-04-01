import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useLocation, useHistory } from "react-router-dom";
import useSWR from "swr";
import formatDistance from "date-fns/formatDistance";
import parseISO from "date-fns/parseISO";
import { FaLeaf, FaExclamationTriangle } from "react-icons/fa";
import { throttle } from "throttle-debounce";

import { TAGLINE, Container, incrementTodayDeleteButtonClicks } from "./Common";

const SUBSET_LENGTH = 25;
const IGNORE_MAX_SECONDS = 60 * 60 * 24 * 3; // 72 hours

export function Locale({ allSuspects, loading }) {
  let [localeLoading, setLocaleLoading] = useState(false);
  let [suspects, setSuspects] = useState(null);
  let [suspectsSubset, setSuspectsSubset] = useState(null);
  let [loadingError, setLoadingError] = useState(null);
  let [seed, setSeed] = useState(Math.random());

  let [currentSuspect, setCurrentSuspect] = useState(null);
  let { locale, slug } = useParams();

  let [ignoredCount, setIgnoredCount] = useState(0);

  useEffect(() => {
    if (!currentSuspect && slug && suspects) {
      const foundCurrentSuspect = suspects.find(s => s.slug === slug);
      if (!foundCurrentSuspect) {
        throw new Error("Work harder!");
      }
      setCurrentSuspect(foundCurrentSuspect);
    }
  }, [slug, suspects, currentSuspect]);

  useEffect(() => {
    let dismounted = false;
    if (currentSuspect) {
      if (!(currentSuspect.lastModified || currentSuspect.lastModifiedError)) {
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
          } else {
            if (!dismounted) {
              setCurrentSuspect(
                Object.assign(
                  {
                    lastModifiedError: r.status
                  },
                  currentSuspect
                )
              );
            }
          }
        });
      }
    }
    return () => {
      dismounted = true;
    };
  }, [currentSuspect]);

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

  const { pathname } = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (currentSuspect) {
      const correctPath = `/${locale}/${currentSuspect.slug}`;
      if (pathname !== correctPath) {
        history.push(correctPath);
      }
    } else if (!slug) {
      const correctPath = `/${locale}`;
      if (pathname !== correctPath) {
        history.push(correctPath);
      }
    }
  }, [locale, currentSuspect, history, pathname, slug]);

  useEffect(() => {
    if (suspects) {
      let ignored = getIgnored(locale);
      let subset = suspects.filter(suspect => {
        return !(suspect.slug in ignored);
      });
      let ignoredCount = suspects.length - subset.length;
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
      setSuspectsSubset(subset.slice(0, SUBSET_LENGTH));
      setIgnoredCount(ignoredCount);
    }
  }, [suspects, seed, locale]);

  function gotoNextSuspect() {
    if (!suspectsSubset.length) {
      // Probably because you've ignored them all!
      setCurrentSuspect(null);
      history.push(`/${locale}`);
      return;
    }
    let index = suspectsSubset.findIndex(s => s.slug === currentSuspect.slug);
    if (index + 1 === suspectsSubset.length) {
      setSeed(Math.random());
    } else {
      let nextIndex = (index + 1) % suspectsSubset.length;
      setCurrentSuspect(suspectsSubset[nextIndex]);
    }
  }

  function gotoPreviousSuspect() {
    let index = suspectsSubset.findIndex(s => s.slug === currentSuspect.slug);
    let nextIndex = index === 0 ? suspectsSubset.length - 1 : index - 1;
    setCurrentSuspect(suspectsSubset[nextIndex]);
  }

  function keyboardHandler(event) {
    if (currentSuspect) {
      // if (event.code === "Escape") {
      //   setCurrentSuspect(null);
      // } else if (event.code === "ArrowRight") {
      //   gotoNextSuspect();
      // } else if (event.code === "ArrowLeft") {
      //   gotoPreviousSuspect();
      // }
      if (event.code === "ArrowRight") {
        gotoNextSuspect();
      } else if (event.code === "ArrowLeft") {
        gotoPreviousSuspect();
      }
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", keyboardHandler);
    return () => {
      document.removeEventListener("keydown", keyboardHandler);
    };
  });

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
        <Container className="locale">
          <div>
            <h1 className="title">
              {thisLocale.language.English} / {thisLocale.language.native} (
              {locale})
            </h1>
          </div>
        </Container>
      )}
      {loadingError && <h4>Loading error; {loadingError}</h4>}

      {(loading || localeLoading) && !loadingError && <p>Loading...</p>}
      {!(loading || localeLoading) &&
        !currentSuspect &&
        suspects &&
        suspectsSubset && (
          <Container>
            <ShowSuspects
              suspects={suspects}
              subset={suspectsSubset}
              ignoredCount={ignoredCount}
              gotoNext={gotoNextSuspect}
              gotoPrevious={gotoPreviousSuspect}
              setCurrentSuspect={setCurrentSuspect}
              getStarted={() => {
                setCurrentSuspect(suspectsSubset[0]);
              }}
              refreshSubset={() => {
                setSeed(Math.random());
              }}
            />
          </Container>
        )}
      {currentSuspect && (
        <ShowSuspect
          locale={locale}
          suspect={currentSuspect}
          gotoNext={gotoNextSuspect}
          gotoPrevious={gotoPreviousSuspect}
          close={event => {
            event.preventDefault();
            history.replace(`/${locale}`);
            setCurrentSuspect(null);
          }}
          ignore={event => {
            event.preventDefault();
            setIgnored(currentSuspect.locale, currentSuspect.slug);
            gotoNextSuspect();
          }}
        />
      )}
    </div>
  );
}

function getIgnored(locale) {
  let allIgnored = JSON.parse(localStorage.getItem("ignored") || "{}");
  let ignored = allIgnored[locale] || {};
  let filtered = false;
  let checked = {};
  let now = new Date().getTime();
  Object.entries(ignored).forEach(([slug, ts]) => {
    if (now - ts > IGNORE_MAX_SECONDS * 1000) {
      filtered = true;
    } else {
      checked[slug] = ts;
    }
  });
  if (filtered) {
    allIgnored[locale] = checked;
    console.warn(
      "Updating the localStorage(ignored) because some were too old"
    );
    localStorage.setItem("ignored", JSON.stringify(allIgnored));
  }
  return checked;
}

function setIgnored(locale, slug) {
  let allIgnored = JSON.parse(localStorage.getItem("ignored") || "{}");
  let ignored = allIgnored[locale] || {};
  ignored[slug] = new Date().getTime();
  allIgnored[locale] = ignored;
  localStorage.setItem("ignored", JSON.stringify(allIgnored));
}

function ShowSuspects({
  suspects,
  subset,
  // showPreview,
  // suspect,
  setCurrentSuspect,
  getStarted,
  // refreshSubset,
  ignoredCount
}) {
  let { locale } = useParams();

  return (
    <div>
      <h3>There are {suspects.length} suspects in this locale</h3>
      {!!ignoredCount && (
        <p>
          <b>{ignoredCount} suspects have been ignored by you.</b>
        </p>
      )}

      {!ignoredCount || ignoredCount < suspects.length ? (
        <div>
          <p>
            Showing you {SUBSET_LENGTH} randomly selected ones.
            <br />
            Review one at a time and ask yourself{" "}
            <i>"Is this page still mostly all English?"</i>
          </p>
          <p className="has-text-centered">
            <button
              className="button is-primary is-large"
              type="button"
              onClick={getStarted}
            >
              Get started!
            </button>
          </p>
        </div>
      ) : (
        <p className="has-text-centered">
          <Link to="/">Pick another language</Link>
        </p>
      )}

      {subset.map(suspect => {
        let uri = `/${suspect.locale}/docs/${suspect.metadata.slug}`;
        let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
        let viewUrl = `https://developer.mozilla.org${uri}`;
        return (
          <div
            className="card"
            key={suspect.metadata.slug}
            style={{ marginBottom: 30 }}
          >
            <div className="card-content">
              <p className="title">
                <Link
                  to={`/${locale}/${suspect.metadata.slug}`}
                  title="Click to inspect further"
                  onClick={event => {
                    setCurrentSuspect(suspect);
                    event.preventDefault();
                  }}
                >
                  {suspect.metadata.title}
                </Link>
              </p>
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

function ShowSuspect({
  suspect,
  locale,
  // close,
  gotoNext,
  gotoPrevious,
  ignore
}) {
  let iFrameRef = useRef();
  let parentIFrameRef = useRef();

  useEffect(() => {
    function updateOtherIFrame(iframe, y) {
      iframe.contentWindow.scrollTo({
        top: y,
        left: 0,
        behavior: "smooth"
      });
    }

    let updateOtherIFrameThrottled = throttle(100, updateOtherIFrame);
    if (iFrameRef.current && parentIFrameRef.current) {
      iFrameRef.current.addEventListener("load", () => {
        iFrameRef.current.contentDocument.addEventListener(
          "scroll",
          () => {
            updateOtherIFrameThrottled(
              parentIFrameRef.current,
              iFrameRef.current.contentWindow.scrollY
            );
          },
          false
        );
      });
    }
  }, [suspect.metadata.slug]);

  let { metadata } = suspect;
  let title = metadata.title;

  let uri = `/${suspect.locale}/docs/${metadata.slug}`;
  let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
  let viewUrl = `https://developer.mozilla.org${uri}`;
  let sp = new URLSearchParams();
  sp.set("uri", uri);
  let src = `/api/v0/preview?${sp.toString()}`;

  let parentSrc;
  let parentEditUrl;
  let parentViewUrl;
  if (metadata.translationof) {
    let parentSp = new URLSearchParams();
    let parentUri = `/en-US/docs/${metadata.translationof}`;
    parentSp.set("uri", parentUri);
    parentSrc = `/api/v0/preview?${parentSp.toString()}`;

    parentEditUrl = `https://wiki.developer.mozilla.org${parentUri}/$edit`;
    parentViewUrl = `https://developer.mozilla.org${parentUri}`;
  }

  let wikiUrl = "https://wiki.developer.mozilla.org" + uri;
  let deleteUrl =
    wikiUrl +
    "$delete?reason=" +
    encodeURIComponent("It was never fully translated from English.");

  return (
    <div>
      <div className="columns">
        <div className="column is-one-third">
          <p>
            <a
              className="button is-primary "
              target="_blank"
              rel="noopener noreferrer"
              href={deleteUrl}
              disabled={!suspect.lastModified}
              onClick={() => {
                incrementTodayDeleteButtonClicks();
                setTimeout(() => {
                  gotoNext();
                }, 100);
              }}
            >
              <b>Start deleting on Wiki</b>
            </a>{" "}
            <button
              type="button"
              className="button is-info"
              onClick={ignore}
              title="YOU ignore this suspect for 72 hours"
            >
              Ignore
            </button>{" "}
            &nbsp;{" "}
            <button
              className="button"
              onClick={() => {
                gotoPrevious();
              }}
            >
              Prev
            </button>{" "}
            <button
              className="button"
              title="You might be better off using the 'Ignore' button"
              onClick={() => {
                gotoNext();
              }}
            >
              Next
            </button>{" "}
            <br />
          </p>
          <p title={`Locale: ${suspect.locale}; Slug: ${metadata.slug}`}>
            <code>{metadata.slug}</code>
          </p>
        </div>
        <div className="column">
          <ShowRevisions suspect={suspect} />
        </div>
      </div>

      <div className="columns">
        <div className="column is-half">
          <h4>
            This page (what we might delete) &mdash;{" "}
            <a href={editUrl} target="_blank" rel="noopener noreferrer">
              Edit in Wiki
            </a>
            ,{" "}
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
              View on MDN
            </a>
          </h4>
          <iframe
            ref={iFrameRef}
            src={src}
            title={title}
            width={"100%"}
            height={900}
          ></iframe>
        </div>
        <div className="column is-half">
          <h4>
            Parent page (the fallback page)
            {parentEditUrl && parentViewUrl && (
              <span>
                &mdash;{" "}
                <a
                  href={parentEditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edit in Wiki
                </a>
                ,{" "}
                <a
                  href={parentViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on MDN
                </a>
              </span>
            )}
          </h4>

          {parentSrc ? (
            <iframe
              ref={parentIFrameRef}
              src={parentSrc}
              title={title}
              width={"100%"}
              height={900}
            ></iframe>
          ) : (
            <p>
              <i>Parent page does not exist</i>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShowRevisions({ suspect }) {
  const [showAll, setShowAll] = useState(false);
  let sp = new URLSearchParams();
  sp.set("locale", suspect.locale);
  sp.set("slug", suspect.slug);
  if (suspect.metadata.translationof) {
    sp.set("translationof", suspect.metadata.translationof);
  }
  let apiUrl = `/api/v0/revisions?${sp.toString()}`;
  const { data, error } = useSWR(
    apiUrl,
    url => {
      return fetch(url).then(r => {
        if (!r.ok) {
          throw new Error(`${r.status} on ${url}`);
        }
        return r.json();
      });
    },
    { revalidateOnFocus: false }
  );

  if (error) {
    return (
      <div className="revisions">
        <article className="message is-danger">
          <div className="message-body">
            <p>Unable to load revisions. </p>
            <pre>{error.toString()}</pre>
          </div>
        </article>
      </div>
    );
  } else if (!data) {
    return (
      <div className="revisions">
        <p>Loading revision history...</p>
      </div>
    );
  }

  let uri = `/${suspect.locale}/docs/${suspect.metadata.slug}`;
  let wikiHistoryUrl = `https://wiki.developer.mozilla.org${uri}$history`;
  let enUSUri = `/en-US/docs/${suspect.metadata.translationof}`;
  let enUSWikiHistoryUrl = `https://wiki.developer.mozilla.org${enUSUri}$history`;

  let guessedAge = null;
  if (data.revisions.length && data.enUSRevisions.length) {
    let firsts = data.revisions
      .filter(r => r.creator !== "mdnwebdocs-bot")
      .map(r => r.date);
    let firstEnUss = data.enUSRevisions
      .filter(r => r.creator !== "mdnwebdocs-bot")
      .map(r => r.date);
    if (firsts.length && firstEnUss.length) {
      let first = firsts[0];
      let enUs = firstEnUss[0];
      guessedAge = formatDistance(parseISO(first), parseISO(enUs));
    }
  }

  const MAX_SHOW_REVISIONS = 3;

  let revisions = showAll
    ? data.revisions
    : data.revisions.slice(0, MAX_SHOW_REVISIONS);
  let enUSRevisions = showAll
    ? data.enUSRevisions
    : data.enUSRevisions.slice(0, MAX_SHOW_REVISIONS);
  return (
    <div className="revisions columns">
      <div className="column is-one-third">
        <h4>Guessed age</h4>
        {guessedAge ? <b>{guessedAge}</b> : <i>Unabled to guess</i>}
      </div>
      <div className="column is-one-third">
        <h5>
          <a href={wikiHistoryUrl} target="_blank" rel="noopener noreferrer">
            Revisions
          </a>
        </h5>
        <ul>
          {revisions.map(revision => (
            <li key={revision.id}>
              {revision.date.replace(/\.\d+/, "")} by {revision.creator}
            </li>
          ))}
          {data.revisions.length > MAX_SHOW_REVISIONS && (
            <li>
              <a
                href="#revisions"
                onClick={event => {
                  event.preventDefault();
                  setShowAll(!showAll);
                }}
              >
                {showAll ? "Hide most" : `Show all (${data.revisions.length})`}
              </a>
            </li>
          )}
        </ul>
      </div>
      <div className="column is-one-third">
        <h5>
          <a
            href={enUSWikiHistoryUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            en-US Revisions
          </a>
        </h5>
        <ul>
          {enUSRevisions.map(revision => (
            <li key={revision.id}>
              {revision.date.replace(/\.\d+/, "")} by {revision.creator}
            </li>
          ))}
          {data.enUSRevisions.length > MAX_SHOW_REVISIONS && (
            <li>
              <a
                href="#revisions"
                onClick={event => {
                  event.preventDefault();
                  setShowAll(!showAll);
                }}
              >
                {showAll
                  ? "Hide most"
                  : `Show all (${data.enUSRevisions.length})`}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
