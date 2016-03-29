package sourcegraph

import (
	"net/url"
	"strings"

	"sourcegraph.com/sourcegraph/sourcegraph/go-sourcegraph/spec"
)

// IsSystemOfRecord returns true iff this repository is the source of truth (not a mirror, etc)
func (r *Repo) IsSystemOfRecord() bool {
	return !r.Mirror
}

// Returns the repository's canonical clone URL
func (r *Repo) CloneURL() *url.URL {
	var cloneURL string
	if r.HTTPCloneURL != "" {
		cloneURL = r.HTTPCloneURL
	} else if r.SSHCloneURL != "" {
		cloneURL = string(r.SSHCloneURL)
	} else {
		cloneURL = r.URI
	}
	u, _ := url.Parse(cloneURL)
	return u
}

// RepoSpec returns the RepoSpec that specifies r.
func (r *Repo) RepoSpec() RepoSpec {
	return RepoSpec{URI: r.URI}
}

// IsZero reports whether s.URI is the zero value.
func (s RepoSpec) IsZero() bool { return s.URI == "" }

// SpecString returns the string representation of the RepoSpec (which
// is just the URI). If the URI is empty, it panics.
func (s RepoSpec) SpecString() string {
	if s.IsZero() {
		panic("empty RepoSpec")
	}
	return s.URI
}

// RouteVars returns route variables for constructing repository
// routes.
func (s RepoSpec) RouteVars() map[string]string {
	return map[string]string{"Repo": s.SpecString()}
}

// ParseRepoSpec parses a string generated by (RepoSpec).SpecString()
// and returns the equivalent RepoSpec struct.
func ParseRepoSpec(s string) (RepoSpec, error) {
	repo, err := spec.ParseRepo(s)
	if err != nil {
		return RepoSpec{}, err
	}
	return RepoSpec{URI: repo}, nil
}

// UnmarshalRepoSpec marshals a map containing route variables
// generated by (*RepoSpec).RouteVars() and returns the
// equivalent RepoSpec struct.
func UnmarshalRepoSpec(routeVars map[string]string) (RepoSpec, error) {
	return ParseRepoSpec(routeVars["Repo"])
}

// RouteVars returns route variables for constructing routes to a
// repository commit.
func (s RepoRevSpec) RouteVars() map[string]string {
	m := s.RepoSpec.RouteVars()
	m["Rev"] = "@" + s.ResolvedRevString()
	return m
}

// ResolvedRevString encodes the revision and commit ID. If CommitID
// is set, the return value is "Rev===CommitID"; otherwise, it is just
// "Rev". See the docstring for RepoRevSpec for an explanation why.
func (s RepoRevSpec) ResolvedRevString() string {
	return spec.ResolvedRevString(s.Rev, s.CommitID)
}

// Resolved reports whether the revspec has been fully resolved to an
// absolute (40-char) commit ID.
func (s RepoRevSpec) Resolved() bool {
	return s.Rev != "" && len(s.CommitID) == 40
}

// UnmarshalRepoRevSpec marshals a map containing route variables
// generated by (RepoRevSpec).RouteVars() and returns the equivalent
// RepoRevSpec struct.
func UnmarshalRepoRevSpec(routeVars map[string]string) (RepoRevSpec, error) {
	repo, err := UnmarshalRepoSpec(routeVars)
	if err != nil {
		return RepoRevSpec{}, err
	}

	rrspec := RepoRevSpec{RepoSpec: repo}
	if revStr := routeVars["Rev"]; revStr != "" {
		if !strings.HasPrefix(revStr, "@") {
			panic("Rev should have had '@' prefix from route")
		}
		revStr = strings.TrimPrefix(revStr, "@")
		rrspec.Rev, rrspec.CommitID = spec.ParseResolvedRev(revStr)
	}
	if _, ok := routeVars["CommitID"]; ok {
		panic("unexpected CommitID route var; was removed in the simple-routes branch")
	}
	return rrspec, nil
}

// IsAppEnabled returns a boolean indicating whether the given app is
// configured to be enabled.
func (c *RepoConfig) IsAppEnabled(app string) bool {
	for _, app2 := range c.Apps {
		if app2 == app {
			return true
		}
	}
	return false
}
