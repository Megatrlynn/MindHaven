import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash,
  X,
  Save,
} from 'lucide-react';

type Article = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  category: string;
  created_at?: string;
};

type ArticleForm = {
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  category: string;
};

const emptyForm: ArticleForm = {
  title: '',
  content: '',
  excerpt: '',
  image_url: '',
  category: '',
};

const ManageArticles = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ArticleForm>(emptyForm);

  const categories = [
    'Mental Health',
    'Nutrition',
    'Exercise',
    'General Health',
    'Health & Wellness',
    'Lifestyle',
  ];

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);

    let query = supabase.from('health_articles').select('*').order('created_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading articles:', error);
    } else {
      setArticles((data || []) as Article[]);
    }

    setLoading(false);
  };

  const filteredArticles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return articles;

    return articles.filter((article) => {
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q)
      );
    });
  }, [articles, searchTerm]);

  const openCreateForm = () => {
    setEditingArticleId(null);
    setFormValues(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (article: Article) => {
    setEditingArticleId(article.id);
    setFormValues({
      title: article.title,
      excerpt: article.excerpt,
      image_url: article.image_url || '',
      content: article.content,
      category: article.category,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
    setEditingArticleId(null);
    setFormValues(emptyForm);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    setLoading(true);
    const { error } = await supabase.from('health_articles').delete().eq('id', id);

    if (error) {
      console.error('Error deleting article:', error);
      setLoading(false);
      return;
    }

    await fetchArticles();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingArticleId !== null) {
      const { error } = await supabase.from('health_articles').update(formValues).eq('id', editingArticleId);
      if (error) {
        console.error('Error updating article:', error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('health_articles').insert([formValues]);
      if (error) {
        console.error('Error creating article:', error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeForm();
    await fetchArticles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--mh-text)]">Articles Management</h2>
          <p className="mt-1 text-sm text-[var(--mh-text-muted)]">Create, update, and organize educational content.</p>
        </div>

        <button onClick={openCreateForm} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Article
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mh-text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, excerpt, or category"
            className="w-full rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface)] py-2 pl-10 pr-3 text-sm text-[var(--mh-text)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <div>
          <select
            className="w-full rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            onChange={(e) => setSelectedCategory(e.target.value)}
            value={selectedCategory}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--mh-text-muted)]">
            <FolderOpen className="h-3.5 w-3.5" />
            Filter by category
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredArticles.map((article) => (
          <article key={article.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[var(--mh-text)]">{article.title}</h3>
                <p className="mt-1 inline-flex rounded-full bg-[var(--mh-surface-soft)] px-2 py-1 text-xs font-medium text-[var(--mh-text-muted)]">
                  {article.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(article)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-100 text-rose-700 transition-colors hover:bg-rose-200"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-[var(--mh-text-muted)]">{article.excerpt}</p>

            {article.image_url ? (
              <img
                src={article.image_url}
                alt={article.title}
                className="mt-3 h-40 w-full rounded-lg border border-[var(--mh-border)] object-cover"
              />
            ) : (
              <div className="mt-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--mh-border)] bg-[var(--mh-surface-soft)] text-sm text-[var(--mh-text-muted)]">
                No image provided
              </div>
            )}
          </article>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="mt-8 rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] p-6 text-center text-sm text-[var(--mh-text-muted)]">
          No articles match your filters.
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={closeForm}>
          <div className="surface-card w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-xl font-semibold text-[var(--mh-text)]">
                <FileText className="h-5 w-5 text-cyan-700" />
                {editingArticleId !== null ? 'Update Article' : 'Create Article'}
              </h3>
              <button onClick={closeForm} className="rounded-lg p-1 text-[var(--mh-text-muted)] transition-colors hover:bg-[var(--mh-surface-soft)] hover:text-[var(--mh-text-muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">Title</label>
                <input
                  type="text"
                  required
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text)] placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">Category</label>
                <select
                  required
                  value={formValues.category}
                  onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">Excerpt</label>
                <input
                  type="text"
                  required
                  value={formValues.excerpt}
                  onChange={(e) => setFormValues({ ...formValues, excerpt: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text)] placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">Image URL</label>
                <input
                  type="url"
                  value={formValues.image_url}
                  onChange={(e) => setFormValues({ ...formValues, image_url: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text)] placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">Content</label>
                <textarea
                  rows={6}
                  required
                  value={formValues.content}
                  onChange={(e) => setFormValues({ ...formValues, content: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-sm text-[var(--mh-text)] placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-1">
                <button type="button" onClick={closeForm} className="btn-subtle">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingArticleId !== null ? 'Update Article' : 'Create Article'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageArticles;


