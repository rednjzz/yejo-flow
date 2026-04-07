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

ActiveRecord::Schema[8.1].define(version: 2026_04_07_151902) do
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

  create_table "contract_details", force: :cascade do |t|
    t.integer "amount", default: 0, null: false
    t.integer "contract_id", null: false
    t.datetime "created_at", null: false
    t.string "item_name", null: false
    t.integer "project_id", null: false
    t.decimal "quantity", precision: 12, scale: 3
    t.integer "sort_order", default: 0, null: false
    t.string "unit"
    t.integer "unit_price"
    t.datetime "updated_at", null: false
    t.integer "work_type_id", null: false
    t.index ["contract_id", "sort_order"], name: "index_contract_details_on_contract_id_and_sort_order"
    t.index ["contract_id"], name: "index_contract_details_on_contract_id"
    t.index ["project_id"], name: "index_contract_details_on_project_id"
    t.index ["work_type_id"], name: "index_contract_details_on_work_type_id"
  end

  create_table "contracts", force: :cascade do |t|
    t.integer "change_amount"
    t.integer "change_seq"
    t.integer "contract_amount", null: false
    t.date "contract_date", null: false
    t.string "contract_no", null: false
    t.string "contract_type", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "contract_type"], name: "index_contracts_on_project_id_and_contract_type"
    t.index ["project_id"], name: "index_contracts_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.date "actual_end_date"
    t.integer "advance_amount"
    t.decimal "advance_rate", precision: 5, scale: 2
    t.integer "client_id", null: false
    t.integer "contract_amount", null: false
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.integer "manager_id"
    t.text "notes"
    t.string "project_code", null: false
    t.string "project_name", null: false
    t.decimal "retention_rate", precision: 5, scale: 2
    t.string "site_address"
    t.date "start_date", null: false
    t.string "status", default: "preparing", null: false
    t.datetime "updated_at", null: false
    t.integer "vat_amount"
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

  add_foreign_key "contract_details", "contracts"
  add_foreign_key "contract_details", "projects"
  add_foreign_key "contract_details", "work_types"
  add_foreign_key "contracts", "projects"
  add_foreign_key "projects", "companies", column: "client_id"
  add_foreign_key "projects", "users", column: "manager_id"
  add_foreign_key "sessions", "users"
  add_foreign_key "work_types", "work_types", column: "parent_id"
end
