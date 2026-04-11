# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_11_060000) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.string "company_code", null: false
    t.string "company_name", null: false
    t.string "company_type", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["company_code"], name: "index_companies_on_company_code", unique: true
    t.index ["company_type", "is_active"], name: "index_companies_on_company_type_and_is_active"
  end

  create_table "contract_items", force: :cascade do |t|
    t.bigint "amount", default: 0, null: false
    t.integer "contract_id", null: false
    t.datetime "created_at", null: false
    t.string "item_name", null: false
    t.integer "project_id", null: false
    t.decimal "quantity", precision: 12, scale: 3
    t.integer "sort_order", default: 0, null: false
    t.string "unit"
    t.bigint "unit_price"
    t.datetime "updated_at", null: false
    t.integer "work_type_id", null: false
    t.index ["contract_id", "sort_order"], name: "index_contract_items_on_contract_id_and_sort_order"
    t.index ["contract_id"], name: "index_contract_items_on_contract_id"
    t.index ["project_id"], name: "index_contract_items_on_project_id"
    t.index ["work_type_id"], name: "index_contract_items_on_work_type_id"
  end

  create_table "contract_payment_terms", force: :cascade do |t|
    t.bigint "amount"
    t.string "condition"
    t.integer "contract_id", null: false
    t.datetime "created_at", null: false
    t.date "due_date"
    t.string "interim_method"
    t.bigint "paid_amount"
    t.date "paid_date"
    t.decimal "rate", precision: 5, scale: 2
    t.integer "seq", default: 1, null: false
    t.integer "sort_order", default: 0, null: false
    t.string "term_type", null: false
    t.datetime "updated_at", null: false
    t.index ["contract_id", "term_type", "seq"], name: "idx_payment_terms_unique", unique: true
    t.index ["contract_id"], name: "index_contract_payment_terms_on_contract_id"
  end

  create_table "contracts", force: :cascade do |t|
    t.bigint "change_amount"
    t.integer "change_seq"
    t.bigint "contract_amount", null: false
    t.string "contract_code", null: false
    t.date "contract_date", null: false
    t.string "contract_type", null: false
    t.datetime "created_at", null: false
    t.integer "defect_liability_months"
    t.decimal "defect_warranty_rate", precision: 5, scale: 2
    t.text "description"
    t.decimal "late_penalty_cap_rate", precision: 5, scale: 2
    t.decimal "late_penalty_rate", precision: 5, scale: 3
    t.text "period_note"
    t.integer "project_id", null: false
    t.text "special_conditions"
    t.bigint "supply_amount", null: false
    t.datetime "updated_at", null: false
    t.bigint "vat_amount", null: false
    t.index ["project_id", "contract_type"], name: "index_contracts_on_project_id_and_contract_type"
    t.index ["project_id"], name: "index_contracts_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.date "actual_end_date"
    t.integer "client_id", null: false
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.integer "manager_id"
    t.text "notes"
    t.string "project_code", null: false
    t.string "project_name", null: false
    t.string "site_address"
    t.date "start_date", null: false
    t.string "status", default: "preparing", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_projects_on_client_id"
    t.index ["manager_id"], name: "index_projects_on_manager_id"
    t.index ["project_code"], name: "index_projects_on_project_code", unique: true
    t.index ["status"], name: "index_projects_on_status"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "site_staff", null: false
    t.datetime "updated_at", null: false
    t.boolean "verified", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "work_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true, null: false
    t.integer "level", default: 1, null: false
    t.integer "parent_id"
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.string "work_type_code", null: false
    t.string "work_type_name", null: false
    t.index ["is_active", "sort_order"], name: "index_work_types_on_is_active_and_sort_order"
    t.index ["parent_id"], name: "index_work_types_on_parent_id"
    t.index ["work_type_code"], name: "index_work_types_on_work_type_code", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "contract_items", "contracts"
  add_foreign_key "contract_items", "projects"
  add_foreign_key "contract_items", "work_types"
  add_foreign_key "contract_payment_terms", "contracts"
  add_foreign_key "contracts", "projects"
  add_foreign_key "projects", "companies", column: "client_id"
  add_foreign_key "projects", "users", column: "manager_id"
  add_foreign_key "sessions", "users"
  add_foreign_key "work_types", "work_types", column: "parent_id"
end
