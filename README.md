What Did I Do?

A tool to see how much of a Git project's blame belongs to each contributor. Not necessarily a useful metric, but something interesting to look at.

Note: After a hackathon weekend, this project's web ui is in a broken state. The command line should still work fine, though.

````
Usage: node app.js [options] [project_directory]

If no project_directory is specified, current working directory is used.

Options:
  -h Print this usage
  -v Print verbose messages
  -i regex Pattern for files to ignore
  -p Print overall contributors's percentages
````

By default, the tool will print an object of form

````
{
    totalLines: xxx,
    files: {
        foo.txt: {
            totalLines: xxx
            contributor.email: yyy,
            other.contributor.email: zzz
        }
    },
    contributors: {
        contributors.email: yyy,
        other.contributors.email: zzz
    }
}
````

If you provide the `-p` flag, it will instead print out percentage by contributor.
````
55.11 | contributor.email
40.99 | other.contributor.email
 4.00 | not.committed.yet
````

Note, if a user has uncommitted changes on their machine, the `not.committed.yet` address is what `git blame` provides.
