"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Community, createCommunity, getCommunities } from "../../lib/api";
import { Empty, ErrorBanner, Loading } from "../components/Feedback";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async (query = search) => {
    setLoading(true);
    setError("");
    try {
      setCommunities(await getCommunities({ search: query, limit: 24, skip: 0 }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load communities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(""); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createCommunity(name.trim(), description.trim());
      setCommunities((current) => [created, ...current]);
      setName(""); setDescription(""); setShowCreate(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create community.");
    } finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <section className="vf-page-heading">
      <div><p className="vf-eyebrow">Explore together</p><h1>Communities</h1><p>Find focused spaces for the conversations you care about.</p></div>
      <button className="vf-btn-primary" onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Close" : "Create community"}</button>
    </section>
    {showCreate ? <form onSubmit={submit} className="vf-card grid gap-3 p-5 sm:grid-cols-2" aria-label="Create community">
      <input className="vf-input" placeholder="Community name" value={name} onChange={(event) => setName(event.target.value)} required />
      <input className="vf-input" placeholder="Short description" value={description} onChange={(event) => setDescription(event.target.value)} />
      <button className="vf-btn-primary sm:col-span-2 sm:justify-self-end" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
    </form> : null}
    <form onSubmit={(event) => { event.preventDefault(); void load(); }} className="vf-search-row"><input className="vf-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search communities" aria-label="Search communities" /><button className="vf-btn-secondary px-4" type="submit">Search</button></form>
    {error ? <ErrorBanner message={error} /> : null}
    {loading ? <Loading label="Loading communities..." /> : communities.length === 0 ? <Empty title="No communities found" message="Try another search or create the first one." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{communities.map((community) => <Link className="vf-card vf-card-link p-5" href={`/communities/${community.id}`} key={community.id}><p className="vf-eyebrow">Community</p><h2 className="mt-2 text-lg font-semibold">{community.name}</h2><p className="mt-2 line-clamp-3 text-sm text-slate-400">{community.description || "A new place for thoughtful conversation."}</p><span className="mt-5 block text-sm font-semibold text-[hsl(var(--accent))]">Open community →</span></Link>)}</div>}
  </div>;
}