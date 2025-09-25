// import { supabase } from "../lib/supabase-client.js";

// // Core integrations mimicking Base44
// export const Core = {
//   // UploadFile برای attachments
//   UploadFile: async (file) => {
//     if (!file) throw new Error("No file provided");

//     // آپلود به Supabase Storage (bucket 'attachments' را ایجاد کنید)
//     const fileName = `${Date.now()}-${file.name}`;
//     const { data, error } = await supabase.storage
//       .from("attachments")
//       .upload(fileName, file);

//     if (error) throw error;

//     // URL عمومی را برگردان
//     const {
//       data: { publicUrl },
//     } = supabase.storage.from("attachments").getPublicUrl(fileName);

//     return { id: data.path, url: publicUrl, name: file.name };
//   },

//   // Placeholder برای invokeLLM یا SendEmail (اگر نیاز دارید)
//   invokeLLM: async (prompt) => {
//     console.warn("invokeLLM not implemented - integrate with OpenAI if needed");
//     return { response: "Placeholder response" };
//   },

//   SendEmail: async (options) => {
//     console.warn("SendEmail not implemented");
//     return { success: true };
//   },
// };

// // Export مستقیم UploadFile برای import در Editor.jsx
// export const UploadFile = Core.UploadFile;

// export default Core;
