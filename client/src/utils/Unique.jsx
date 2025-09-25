// Example using Supabase
import { supabase } from "../supabaseClient";

export const checkUniqueValue = async (tables, column, value) => {
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(column, value)
      .limit(1);

    if (error) {
      console.error("Error checking uniqueness:", error);
      return false; // treat as not unique if error occurs
    }

    if (data && data.length > 0) {
      return false; // value already exists
    }
  }
  return true; // value is unique across all tables
};
