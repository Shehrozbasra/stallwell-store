import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Central place both the storefront and the seller dashboard use
// to read and write the live product list.
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Live updates: if the seller changes stock on another device/tab,
    // customers looking at the page get the update without refreshing.
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        refresh();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  async function addProduct(product) {
    const { error } = await supabase.from("products").insert([product]);
    if (error) throw new Error(error.message);
  }

  async function updateProduct(id, updates) {
    const { error } = await supabase.from("products").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  return { products, loading, error, refresh, addProduct, updateProduct, deleteProduct };
}
