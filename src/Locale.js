import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation, useHistory } from "react-router-dom";
import useSWR from "swr";
import formatDistance from "date-fns/formatDistance";
import parseISO from "date-fns/parseISO";
import { FaLeaf, FaExclamationTriangle } from "react-icons/fa";

import { TAGLINE, Container } from "./Common";

const SUBSET_LENGTH = 25;
const IGNORE_MAX_SECONDS = 60 * 60 * 24 * 3; // 72 hours

export function Locale({ allSuspects, loading }) {
  let [localeLoading, setLocaleLoading] = useState(false);
  let [suspects, setSuspects] = useState(null);
  let [suspectsSubset, setSuspectsSubset] = useState(null);
  let [loadingError, setLoadingError] = useState(null);
  let [seed, setSeed] = useState(Math.random());

  // const currentLocation = useLocation();
  // const history = useHistory();
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
    console.log({ currentSuspect, pathname });
    if (currentSuspect) {
      const correctPath = `/${locale}/${currentSuspect.slug}`;
      if (pathname !== correctPath) {
        // history.replace(correctPath);
        history.push(correctPath);
      }
    } else if (!slug) {
      const correctPath = `/${locale}`;
      if (pathname !== correctPath) {
        history.push(correctPath);
      }
    }
  }, [locale, currentSuspect, history, pathname, slug]);

  // useEffect(() => {
  //   if (currentSuspect) {
  //     if (currentLocation.hash !== `#${currentSuspect.slug}`) {
  //       // console.log("Hash needs to update!");
  //       // history.replace(`#${currentSuspect.slug}`);
  //       history.replace({ hash: currentSuspect.slug });
  //     }
  //   } else if (currentLocation.hash) {
  //     // console.log("Hash needs to be removed");
  //     // history.push(`#neither`);
  //     // console.log(window.document.location);
  //     history.replace({ hash: "" });
  //   }
  // }, [currentSuspect, currentLocation, history]);

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

  // useEffect(() => {
  //   if (suspectsSubset && currentLocation.hash && !currentSuspect) {
  //     console.log(
  //       "DRAW FOR HASH?!",
  //       currentLocation.hash,
  //       suspectsSubset.map(s => s.slug)
  //     );
  //     if (
  //       suspectsSubset.map(s => `#${s.slug}`).includes(currentLocation.hash)
  //     ) {
  //       setCurrentSuspect(
  //         suspectsSubset.find(s => currentLocation.hash === `#${s.slug}`)
  //       );
  //     }
  //   }
  //   }, [suspectsSubset, currentLocation.hash, currentSuspect]);

  function gotoNextSuspect() {
    let index = suspectsSubset.findIndex(s => s.slug === currentSuspect.slug);
    if (index + 1 === suspectsSubset.length) {
      setSeed(Math.random());
      // setCurrentSuspect(suspectsSubset[0]);
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
      if (event.code === "Escape") {
        setCurrentSuspect(null);
      } else if (event.code === "ArrowRight") {
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

  // function showPreview(suspect) {
  //   setCurrentSuspect(suspect);
  // }

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
        <Container>
          <h1 className="title">
            {thisLocale.language.English} / {thisLocale.language.native} (
            {locale})
          </h1>
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
              // showPreview={showPreview}
              setCurrentSuspect={setCurrentSuspect}
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
          ignore={suspect => {
            setIgnored(locale, suspect.slug);
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
  refreshSubset,
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
      <p>
        Showing you {SUBSET_LENGTH} randomly selected ones.
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

function ShowSuspect({ suspect, locale, close, gotoNext, gotoPrevious }) {
  let { metadata } = suspect;
  let title = metadata.title;

  let uri = `/${suspect.locale}/docs/${metadata.slug}`;
  let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
  let viewUrl = `https://developer.mozilla.org${uri}`;
  let sp = new URLSearchParams();
  sp.set("uri", uri);
  let src = `/api/v0/preview?${sp.toString()}`;

  let parentSp = new URLSearchParams();
  let parentUri = `/en-US/docs/${metadata.translationof}`;
  parentSp.set("uri", parentUri);
  let parentSrc = `/api/v0/preview?${parentSp.toString()}`;

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
            <LeafStatus leaf={suspect.leaf} />{" "}
            <a href={editUrl} target="_blank" rel="noopener noreferrer">
              Edit in Wiki
            </a>
            ,{" "}
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
              View on MDN
            </a>
            <br />
            <small>
              {suspect.locale} / {metadata.slug}
            </small>
          </p>
          <div>
            <a
              className="button is-primary "
              target="_blank"
              rel="noopener noreferrer"
              href={deleteUrl}
              disabled={!suspect.lastModified}
              onClick={() => {
                setTimeout(() => {
                  gotoNext();
                }, 100);
              }}
            >
              Start deleting on Wiki
            </a>{" "}
            <a href={`/${locale}`} className="button" onClick={close}>
              Close
            </a>{" "}
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
              onClick={() => {
                gotoNext();
              }}
            >
              Next
            </button>{" "}
          </div>
        </div>
        <div className="column">
          <ShowRevisions suspect={suspect} />
        </div>
      </div>

      {/* <div className="columns">
        <div className="column is-four-fifths">
          <iframe src={src} title={title} width={"100%"} height={800}></iframe>
        </div>
        <div className="column">
          <ShowRevisions suspect={suspect} />
        </div>
      </div> */}
      <div className="columns">
        <div className="column is-half">
          <h4>This page (what we might delete)</h4>
          <iframe src={src} title={title} width={"100%"} height={800}></iframe>
        </div>
        <div className="column is-half">
          <h4>Parent page (the fallback page)</h4>
          <iframe
            src={parentSrc}
            title={title}
            width={"100%"}
            height={800}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

// function PreviewIframeModal({
//   suspect,
//   close,
//   gotoNext,
//   gotoPrevious,
//   ignore
// }) {
//   let { metadata } = suspect;
//   let title = metadata.title;

//   let uri = `/${suspect.locale}/docs/${metadata.slug}`;
//   let editUrl = `https://wiki.developer.mozilla.org${uri}/$edit`;
//   let viewUrl = `https://developer.mozilla.org${uri}`;
//   let sp = new URLSearchParams();
//   sp.set("uri", uri);
//   let src = `/api/v0/preview?${sp.toString()}`;

//   let wikiUrl = "https://wiki.developer.mozilla.org" + uri;
//   let deleteUrl =
//     wikiUrl +
//     "$delete?reason=" +
//     encodeURIComponent("It was never fully translated from English.");
//   return (
//     <div className="modal is-active">
//       <div className="modal-background"></div>
//       <div className="modal-card">
//         <header className="modal-card-head">
//           <p className="modal-card-title">
//             <LeafStatus leaf={suspect.leaf} />{" "}
//             <a href={editUrl} target="_blank" rel="noopener noreferrer">
//               Edit in Wiki
//             </a>
//             ,{" "}
//             <a href={viewUrl} target="_blank" rel="noopener noreferrer">
//               View on MDN
//             </a>
//             <br />
//             <small style={{ fontSize: "80%" }}>
//               {suspect.locale} / {metadata.slug}
//             </small>
//           </p>
//           <button
//             className="delete"
//             aria-label="close"
//             onClick={close}
//           ></button>
//         </header>
//         <section className="modal-card-body">
//           <iframe src={src} title={title} width={1200} height={800}></iframe>
//         </section>
//         <footer className="modal-card-foot">
//           <div className="columns">
//             <div className="column">
//               <p>
//                 {suspect.lastModifiedError ? (
//                   <b>
//                     Error fetching last modified ({suspect.lastModifiedError})
//                   </b>
//                 ) : suspect.lastModified ? (
//                   <span>
//                     <b>Last modified</b> {suspect.lastModified}
//                   </span>
//                 ) : (
//                   <small>fetching last modified...</small>
//                 )}
//               </p>
//             </div>
//             <div className="column">
//               <div className="buttons">
//                 <button
//                   className="button is-link"
//                   onClick={() => ignore(suspect)}
//                   title="YOU ignore this suspect for 72 hours"
//                 >
//                   Ignore
//                 </button>{" "}
//                 <a
//                   className="button is-primary "
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   href={deleteUrl}
//                   disabled={!suspect.lastModified}
//                   onClick={() => {
//                     setTimeout(() => {
//                       gotoNext();
//                     }, 100);
//                   }}
//                 >
//                   Start deleting on Wiki
//                 </a>{" "}
//               </div>
//             </div>
//             <div className="column">
//               <div
//                 className="buttons"
//                 title="Tip: You can navigate with the keyboard ⬅ and ➡ and ␛"
//               >
//                 <button className="button" onClick={gotoPrevious}>
//                   Prev
//                 </button>{" "}
//                 <button className="button" onClick={gotoNext}>
//                   Next
//                 </button>{" "}
//               </div>
//             </div>
//           </div>
//           <div>
//             <ShowRevisions suspect={suspect} />
//             {/* {!revisions && !revisionsLoadingError && (
//                 <p>
//                   <i>Loading revision history...</i>
//                 </p>
//               )}
//               {revisions && !revisionsLoadingError && (
//                 <ShowRevisions revisions={revisions} suspect={suspect} />
//               )} */}
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }

function ShowRevisions({ suspect }) {
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
  let enUSUri = `/${suspect.locale}/docs/${suspect.metadata.slug}`;
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
          {data.revisions.map(revision => (
            <li key={revision.id}>
              {revision.date.replace(/\.\d+/, "")} by {revision.creator}
            </li>
          ))}
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
          {data.enUSRevisions.map(revision => (
            <li key={revision.id}>
              {revision.date.replace(/\.\d+/, "")} by {revision.creator}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
