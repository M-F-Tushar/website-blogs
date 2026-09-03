export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_entries: {
        Row: {
          body_markdown: string
          canonical_url: string | null
          completed_at: string | null
          cover_asset_id: string | null
          created_at: string
          deleted_at: string | null
          entry_type: Database["public"]["Enums"]["academic_entry_type"]
          external_url: string | null
          featured: boolean
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          started_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          canonical_url?: string | null
          completed_at?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          entry_type?: Database["public"]["Enums"]["academic_entry_type"]
          external_url?: string | null
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          canonical_url?: string | null
          completed_at?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          entry_type?: Database["public"]["Enums"]["academic_entry_type"]
          external_url?: string | null
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_entries_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          source_ip: string | null
          spam_flags: string[]
          spam_score: number
          status: Database["public"]["Enums"]["contact_message_status"]
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          source_ip?: string | null
          spam_flags?: string[]
          spam_score?: number
          status?: Database["public"]["Enums"]["contact_message_status"]
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          source_ip?: string | null
          spam_flags?: string[]
          spam_score?: number
          status?: Database["public"]["Enums"]["contact_message_status"]
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          blur_data_url: string | null
          bucket_name: string
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          is_public: boolean
          label: string | null
          mime_type: string | null
          object_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          blur_data_url?: string | null
          bucket_name: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_public?: boolean
          label?: string | null
          mime_type?: string | null
          object_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          blur_data_url?: string | null
          bucket_name?: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_public?: boolean
          label?: string | null
          mime_type?: string | null
          object_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string
          href: string
          id: string
          is_external: boolean
          is_visible: boolean
          label: string
          location: Database["public"]["Enums"]["navigation_location"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_external?: boolean
          is_visible?: boolean
          label: string
          location?: Database["public"]["Enums"]["navigation_location"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_external?: boolean
          is_visible?: boolean
          label?: string
          location?: Database["public"]["Enums"]["navigation_location"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          body_markdown: string
          created_at: string
          featured: boolean
          heading: string
          id: string
          image_asset_id: string | null
          is_visible: boolean
          page_id: string
          section_key: string
          section_type: string
          settings_json: Json
          sort_order: number
          subheading: string | null
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          created_at?: string
          featured?: boolean
          heading: string
          id?: string
          image_asset_id?: string | null
          is_visible?: boolean
          page_id: string
          section_key: string
          section_type: string
          settings_json?: Json
          sort_order?: number
          subheading?: string | null
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          featured?: boolean
          heading?: string
          id?: string
          image_asset_id?: string | null
          is_visible?: boolean
          page_id?: string
          section_key?: string
          section_type?: string
          settings_json?: Json
          sort_order?: number
          subheading?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          is_visible: boolean
          meta_description: string | null
          meta_title: string | null
          og_image_asset_id: string | null
          page_key: Database["public"]["Enums"]["page_key"]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_asset_id?: string | null
          page_key: Database["public"]["Enums"]["page_key"]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_asset_id?: string | null
          page_key?: Database["public"]["Enums"]["page_key"]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_og_image_asset_id_fkey"
            columns: ["og_image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_profile_id: string | null
          body_markdown: string
          canonical_url: string | null
          cover_asset_id: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          featured: boolean
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_profile_id?: string | null
          body_markdown?: string
          canonical_url?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string | null
          body_markdown?: string
          canonical_url?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_asset_id: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          headline: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_asset_id?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          headline?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_asset_id?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_asset_id_fkey"
            columns: ["avatar_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          audience: string | null
          body_markdown: string
          canonical_url: string | null
          category_id: string | null
          cover_asset_id: string | null
          created_at: string
          deleted_at: string | null
          external_url: string | null
          featured: boolean
          id: string
          level: Database["public"]["Enums"]["recommendation_level"]
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          use_case: string | null
          why_recommend: string | null
        }
        Insert: {
          audience?: string | null
          body_markdown?: string
          canonical_url?: string | null
          category_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          external_url?: string | null
          featured?: boolean
          id?: string
          level?: Database["public"]["Enums"]["recommendation_level"]
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          use_case?: string | null
          why_recommend?: string | null
        }
        Update: {
          audience?: string | null
          body_markdown?: string
          canonical_url?: string | null
          category_id?: string | null
          cover_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          external_url?: string | null
          featured?: boolean
          id?: string
          level?: Database["public"]["Enums"]["recommendation_level"]
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          use_case?: string | null
          why_recommend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recommendation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          canonical_url: string | null
          contact_email: string
          created_at: string
          default_og_image_asset_id: string | null
          footer_blurb: string
          github_url: string | null
          id: string
          is_active: boolean
          linkedin_url: string | null
          location_label: string | null
          meta_description: string | null
          meta_title: string | null
          resume_url: string | null
          settings_json: Json
          site_description: string
          site_key: string
          site_name: string
          site_tagline: string
          updated_at: string
          x_url: string | null
        }
        Insert: {
          canonical_url?: string | null
          contact_email: string
          created_at?: string
          default_og_image_asset_id?: string | null
          footer_blurb: string
          github_url?: string | null
          id?: string
          is_active?: boolean
          linkedin_url?: string | null
          location_label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          resume_url?: string | null
          settings_json?: Json
          site_description: string
          site_key?: string
          site_name: string
          site_tagline: string
          updated_at?: string
          x_url?: string | null
        }
        Update: {
          canonical_url?: string | null
          contact_email?: string
          created_at?: string
          default_og_image_asset_id?: string | null
          footer_blurb?: string
          github_url?: string | null
          id?: string
          is_active?: boolean
          linkedin_url?: string | null
          location_label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          resume_url?: string | null
          settings_json?: Json
          site_description?: string
          site_key?: string
          site_name?: string
          site_tagline?: string
          updated_at?: string
          x_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_default_og_image_asset_id_fkey"
            columns: ["default_og_image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      academic_entry_type:
        | "coursework"
        | "project"
        | "research_note"
        | "paper_note"
        | "experiment"
        | "certificate"
      app_role: "admin" | "editor"
      contact_message_status: "new" | "reviewed" | "replied" | "archived"
      content_status: "draft" | "published" | "archived"
      navigation_location: "header" | "footer" | "social"
      page_key:
        | "home"
        | "about"
        | "blogs"
        | "academic"
        | "recommendations"
        | "contact"
      recommendation_level: "beginner" | "intermediate" | "advanced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      academic_entry_type: [
        "coursework",
        "project",
        "research_note",
        "paper_note",
        "experiment",
        "certificate",
      ],
      app_role: ["admin", "editor"],
      contact_message_status: ["new", "reviewed", "replied", "archived"],
      content_status: ["draft", "published", "archived"],
      navigation_location: ["header", "footer", "social"],
      page_key: [
        "home",
        "about",
        "blogs",
        "academic",
        "recommendations",
        "contact",
      ],
      recommendation_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const

