import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Pencil, Trash, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

type Article = {
    id: number;
    title: string;
    content: string;
    excerpt: string;
    image_url: string;
    category: string;
    created_at?: string;
  };

  const ManageArticles = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true); 

    const predefinedCategories = [
        "Mental Health",
        "Nutrition",
        "Exercise",
        "General Health",
        "Health & Wellness",
        "Lifestyle",
    ];  
    const [categories] = useState(predefinedCategories);

    const [newArticle, setNewArticle] = useState({
        title: '',
        content: '',
        excerpt: '',
        image_url: '',
        category: '',
    });

    const [editingArticle, setEditingArticle] = useState<null | Article>(null);
    const [updatedArticle, setUpdatedArticle] = useState({
        title: "",
        excerpt: "",
        image_url: "",
        content: "",
        category: "",
    });

    const handleEditClick = (article: Article) => {
        setEditingArticle(article);
        setUpdatedArticle({
            title: article.title,
            excerpt: article.excerpt,
            image_url: article.image_url,
            content: article.content,
            category: article.category,
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingArticle) return;

        setLoading(true);
        await supabase
            .from("health_articles")
            .update(updatedArticle)
            .match({ id: editingArticle.id });

        setEditingArticle(null);
        await fetchArticles();
    };

    useEffect(() => {
        fetchArticles();
    }, [selectedCategory]);

    const fetchArticles = async () => {
        setLoading(true);
        let query = supabase
            .from('health_articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (selectedCategory) {
            query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;
        if (!error) setArticles(data);
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        await supabase.from('health_articles').delete().match({ id });
        await fetchArticles();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await supabase.from('health_articles').insert([newArticle]);
        setNewArticle({ title: '', content: '', excerpt: '', image_url: '', category: '' });
        await fetchArticles();
    };
    
    if (loading) {
        return (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        );
      }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📝 Manage Articles</h2>
      
            {/* Article Form */}
            <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Article</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Excerpt"
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  value={newArticle.excerpt}
                  onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  value={newArticle.image_url}
                  onChange={(e) => setNewArticle({ ...newArticle, image_url: e.target.value })}
                />
                <select
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Content"
                  className="p-3 border rounded-lg col-span-2 focus:ring-2 focus:ring-blue-400"
                  rows={4}
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                ➕ Create Article
              </button>
            </form>
      
            {/* Filter by Category */}
            <div className="mb-6">
              <select
                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                onChange={(e) => setSelectedCategory(e.target.value)}
                value={selectedCategory}
              >
                <option value="">📂 All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
      
            {/* Articles List */}
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="p-5 border rounded-lg shadow-sm flex items-center justify-between bg-white">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{article.title}</h3>
                    <p className="text-gray-500">{article.category}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200"
                      onClick={() => handleEditClick(article)}
                    >
                      ✏️
                    </button>
                    <button
                      className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this article?")) {
                          handleDelete(article.id);
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
      
              {/* Edit Modal */}
              {editingArticle && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
                  onClick={() => setEditingArticle(null)}
                >
                  {/* Modal Content */}
                  <div
                    className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-xl font-semibold mb-4">✍️ Edit Article</h2>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Title"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={updatedArticle.title}
                        onChange={(e) => setUpdatedArticle({ ...updatedArticle, title: e.target.value })}
                        required
                      />
      
                      <input
                        type="text"
                        placeholder="Excerpt"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={updatedArticle.excerpt}
                        onChange={(e) => setUpdatedArticle({ ...updatedArticle, excerpt: e.target.value })}
                        required
                      />
      
                      <input
                        type="text"
                        placeholder="Image URL"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={updatedArticle.image_url}
                        onChange={(e) => setUpdatedArticle({ ...updatedArticle, image_url: e.target.value })}
                        required
                      />
      
                      <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={updatedArticle.category}
                        onChange={(e) => setUpdatedArticle({ ...updatedArticle, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {predefinedCategories.map((cat, idx) => (
                          <option key={idx} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
      
                      <textarea
                        placeholder="Content"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                        rows={4}
                        value={updatedArticle.content}
                        onChange={(e) => setUpdatedArticle({ ...updatedArticle, content: e.target.value })}
                        required
                      ></textarea>
      
                      {/* Buttons */}
                      <div className="flex justify-end space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                          💾 Save Changes
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200"
                          onClick={() => setEditingArticle(null)}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
      
};

export default ManageArticles;
