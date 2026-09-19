export function readBranches() {
	const branches = ["develop", "beta", "main", "pnpm"];
	// ./git/refs/heads        ==> non-release branches
	// .git/refs/heads/release ==> release branches
	return branches;
}