
const validate = require('../helper/validate')
const model = require("../models/module")
// const { assign } = require('nodemailer/lib/shared');
function groupBy(arr, key) {
    return arr.reduce((acc, obj) => {
        const keyValue = obj[key];
        acc[keyValue] = acc[keyValue] || [];
        acc[keyValue].push(obj);
        return acc;
    }, {});
}
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
    // console.log(randomString);

    return randomString;
}
async function fetchDataForDropdown(dropdownData, model, res) {
    let dropdownMatch = { status: 1 };
    let dropdownQuery = [{ $match: dropdownMatch }];

    let referenceTable = dropdownData.referenceTable.split('.');
    for (let i = 1; i < referenceTable.length; i++) {
        let path = referenceTable.slice(1, i + 1).join('.');
        dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
    }

    if (dropdownData.referenceColumn) {
        const keys = dropdownData.referenceColumn.split(',');
        const regex = /[\s\W]/;
        const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);
        dropdownQuery.push({
            $project: {
                id: 1,
                value: { $concat: fieldsToConcat }
            }
        });
    }

    return await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
}
async function processFields(fields, model, res) {
    for (let field of fields) {
        if (field.controlname === "dropdown" && field.defaultValue.length==0) {
            field.data = await fetchDataForDropdown(field, model, res);
        }
        else if (field.controlname === "dropdown") {
            field.data = field.default_value;
        }
    }
    fields.sort((a, b) => a.ordering - b.ordering);
}


module.exports = {
    add: async (req, res) => {
        try {
            const Collectionname = mongoose.model('tble_bl', schema.tbl_bl);
            const counter = await idCounter(
                Collectionname,
                'bl_id'
            )

            let insesrtdata = {
                bl_id: counter,
                //bl_id: req.body.bl_id,
                memo_id: req.body.memo_id,
                document_type: req.body.document_type,
                trnsport_mode: req.body.trnsport_mode,
                container_plan: req.body.container_plan,
                bl_status: req.body.bl_status,
                bl_document_type: req.body.bl_document_type,
                bl_type: req.body.bl_type,
                mbl_date: req.body.mbl_date,
                mbl_no: req.body.mbl_no,
                hbl_no: req.body.hbl_no,
                hbl_date: req.body.hbl_date,
                no_of_bl: req.body.no_of_bl,
                fcr_no: req.body.fcr_no,
                fcr_date: req.body.fcr_date,
                shipper_name: req.body.shipper_name,
                shipper_name_text: req.body.shipper_name_text,
                shipper_branch: req.body.shipper_branch,
                shipper_branch_text: req.body.shipper_branch_text,
                shipper_address: req.body.shipper_address,

                shipper_area: req.body.shipper_area,

                shipper_pincode: req.body.shipper_pincode,

                shipper_city: req.body.shipper_city,

                shipper_state: req.body.shipper_state,

                shipper_country: req.body.shipper_country,

                consignee_bank: req.body.consignee_bank,

                consignee_bank_text: req.body.consignee_bank_text,

                bank_branch: req.body.bank_branch,

                bank_branch_text: req.body.bank_branch_text,

                consignee_name: req.body.consignee_name,

                consignee_name_text: req.body.consignee_name_text,

                consignee_branch: req.body.consignee_branch,

                consignee_branch_text: req.body.consignee_branch_text,

                consignee_address: req.body.consignee_address,

                consignee_area: req.body.consignee_area,

                consignee_pincode: req.body.consignee_pincode,

                consignee_city: req.body.consignee_city,

                consignee_state: req.body.consignee_state,

                consignee_country: req.body.consignee_country,

                consignee_bank_branch: req.body.consignee_bank_branch,

                consignee_bank_branch_text: req.body.consignee_bank_branch_text,

                notifying_party1_name: req.body.notifying_party1_name,

                notifying_party1_name_text: req.body.notifying_party1_name_text,

                notifying_party1_branch: req.body.notifying_party1_branch,

                notifying_party1_branch_text: req.body.notifying_party1_branch_text,


                notifying_party1_add: req.body.notifying_party1_add,

                notifying_party1_pincode: req.body.notifying_party1_pincode,

                notifying_party1_city: req.body.notifying_party1_city,

                notifying_party1_state: req.body.notifying_party1_state,

                notifying_party1_country: req.body.notifying_party1_country,

                notifying_party2_name: req.body.notifying_party2_name,

                notifying_party2_name_text: req.body.notifying_party2_name_text,

                notifying_party2_branch: req.body.notifying_party2_branch,

                notifying_party2_branch_text: req.body.notifying_party2_branch_text,

                notifying_party2_add: req.body.notifying_party2_add,

                notifying_party2_pincode: req.body.notifying_party2_pincode,

                notifying_party2_city: req.body.notifying_party2_city,

                notifying_party2_state: req.body.notifying_party2_state,

                notifying_party2_country: req.body.notifying_party2_country,

                notifying_party3_name: req.body.notifying_party3_name,

                notifying_party3_name_text: req.body.notifying_party3_name_text,

                notifying_party3_branch: req.body.notifying_party3_branch,

                notifying_party3_branch_text: req.body.notifying_party3_branch_text,

                notifying_party3_add: req.body.notifying_party3_add,

                notifying_party3_pincode: req.body.notifying_party3_pincode,

                notifying_party3_city: req.body.notifying_party3_city,

                notifying_party3_state: req.body.notifying_party3_state,

                notifying_party3_country: req.body.notifying_party3_country,

                hbl_of: req.body.hbl_of,

                hbl_of_text: req.body.hbl_of_text,

                delivery_agent: req.body.delivery_agent,

                delivery_agent_text: req.body.delivery_agent_text,

                delivery_agent_address: req.body.delivery_agent_address,

                delivery_agent_city: req.body.delivery_agent_city,

                delivery_agent_state: req.body.delivery_agent_state,

                delivery_agent_country: req.body.delivery_agent_country,

                delivery_agent_pin: req.body.delivery_agent_pin,

                load_port_agent: req.body.load_port_agent,

                load_port_agent_text: req.body.load_port_agent_text,

                load_port_line: req.body.load_port_line,

                load_port_line_text: req.body.load_port_line_text,

                nominated_agent: req.body.nominated_agent,

                nomnated_agent_text: req.body.nomnated_agent_text,

                load_port_cha: req.body.load_port_cha,

                load_port_cha_text: req.body.load_port_cha_text,

                discharge_port_agent: req.body.discharge_port_agent,

                discharge_port_agent_text: req.body.discharge_port_agent_text,

                vesselname_flightno_id: req.body.vesselname_flightno_id,

                vesselname_flightno_text: req.body.vesselname_flightno_text,

                voyno_flightdatetime_id: req.body.voyno_flightdatetime_id,

                voyno_flightdatetime_text: req.body.voyno_flightdatetime_text,

                plr_id: req.body.plr_id,

                plr_text: req.body.plr_text,

                pol_id: req.body.pol_id,

                pol_text: req.body.pol_text,

                pod_id: req.body.pod_id,

                pod_text: req.body.pod_text,

                fpd_id: req.body.fpd_id,

                fpd_text: req.body.fpd_text,

                pre_carriage: req.body.pre_carriage,

                shipped_on_date: req.body.shipped_on_date,

                bl_issue_place: req.body.bl_issue_place,

                bl_issue_place_text: req.body.bl_issue_place_text,

                date_of_issue: req.body.date_of_issue,

                release_date: req.body.release_date,

                prepaid_collect: req.body.prepaid_collect,

                prepaid_payble_at_text: req.body.prepaid_payble_at_text,

                payable_at: req.body.payable_at,

                payable_at_text: req.body.payable_at_text,

                no_of_free_days: req.body.no_of_free_days,

                no_of_packages: req.body.no_of_packages,

                package_type: req.body.package_type,

                gross_wt: req.body.gross_wt,

                gross_wt_unit: req.body.gross_wt_unit,

                net_wt: req.body.net_wt,

                net_wt_ynit: req.body.net_wt_ynit,

                measurement: req.body.measurement,

                measurement_unit: req.body.measurement_unit,

                cargo_type: req.body.cargo_type,

                imo_code: req.body.imo_code,

                un_no: req.body.un_no,

                pg_no: req.body.pg_no,

                flash_point: req.body.flash_point,

                desc_of_goods: req.body.desc_of_goods,

                marks_nos: req.body.marks_nos,

                remarks: req.body.remarks,

                added_by: req.body.added_by,

                added_on: req.body.added_on,

                updated_by: req.body.updated_by,

                updated_on: req.body.updated_on,

                stuffing_type: req.body.stuffing_type,

                clauses: req.body.clauses,

                m_vesselname_flightno_id: req.body.m_vesselname_flightno_id,

                m_voyno_flightdatetime_id: req.body.m_voyno_flightdatetime_id,

                m_gross_weight: req.body.m_gross_weight,

                m_gross_weight_unit_id: req.body.m_gross_weight_unit_id,

                m_net_weight: req.body.m_net_weight,

                m_net_weight_unit_id: req.body.m_net_weight_unit_id,

                m_measurement: req.body.m_measurement,

                m_measurement_unit_id: req.body.m_measurement_unit_id,

                mbl_type_of_packages: req.body.mbl_type_of_packages,

                mbl_no_of_packages: req.body.mbl_no_of_packages,

                shippingline_airline_id: req.body.shippingline_airline_id,

                shippingline_airline_agent_id: req.body.shippingline_airline_agent_id,

                cha_id: req.body.cha_id,

                tranship_id: req.body.tranship_id,

                special_instruction: req.body.special_instruction,

                gateway_igm_no: req.body.gateway_igm_no,

                gateway_igm_date: req.body.gateway_igm_date,

                gateway_inward_date: req.body.gateway_inward_date,

                mode_of_communication_id: req.body.mode_of_communication_id,

                no_of_container: req.body.no_of_container,

                discharge_port_agent1: req.body.discharge_port_agent1,

                bl_issue_type: req.body.bl_issue_type,

                mbl_chargeable_wt: req.body.mbl_chargeable_wt,

                hbl_chargeable_wt: req.body.hbl_chargeable_wt,

                igm_no: req.body.igm_no,

                igm_date: req.body.igm_date,

                eta: req.body.eta,

                nominated_area_id: req.body.nominated_area_id,

                status: req.body.status,

                isprintSplInstruction: req.body.isprintSplInstruction,

                line_no: req.body.line_no,

                line_sub_no: req.body.line_sub_no,

                type_of_shipment_id: req.body.type_of_shipment_id,

                delivery_type: req.body.delivery_type,

                ff_pol_agent: req.body.ff_pol_agent,

                principal_ff: req.body.principal_ff,

                hbl_status: req.body.hbl_status,

                hbl_issue_place: req.body.hbl_issue_place,

                m_vesselname_flightno_text: req.body.m_vesselname_flightno_text,

                m_voyno_flightdatetime_text: req.body.m_voyno_flightdatetime_text,

                hbl_type: req.body.hbl_type,

                no_of_packages_text: req.body.no_of_packages_text,

                no_of_bl_text: req.body.no_of_bl_text,

                company_id: req.body.company_id,

                blFlag: req.body.blFlag,

                nominated_area_text: req.body.nominated_area_text,

                memoType: req.body.memoType,

                memoCategory: req.body.memoCategory,

                shippingline_airline_agent_text: req.body.shippingline_airline_agent_text,

                shippingline_airline_text: req.body.shippingline_airline_text,

                frtforwarder_id: req.body.frtforwarder_id,

                frtforwarder_text: req.body.frtforwarder_text,

                job_no: req.body.job_no,

                blformat_id: req.body.blformat_id,

                cont_wt_pk: req.body.cont_wt_pk,

                commodity: req.body.commodity,

                container_details: req.body.container_details,

                shippers_reference_no: req.body.shippers_reference_no,

                consignee_reference_no: req.body.consignee_reference_no,

                freight_forwarder_address: req.body.freight_forwarder_address,

                freight_forwarder_pincode: req.body.freight_forwarder_pincode,

                freight_forwarder_city: req.body.freight_forwarder_city,

                freight_forwarder_state: req.body.freight_forwarder_state,

                freight_forwarder_country: req.body.freight_forwarder_country,

                country_of_origin: req.body.country_of_origin,

                clause_id: req.body.clause_id,

                service_type: req.body.service_type,

                terminal_id: req.body.terminal_id,

                loosePackage: req.body.loosePackage,

                loosePackage_unit_id: req.body.loosePackage_unit_id,

                sb_no_date: req.body.sb_no_date,

                imo_class: req.body.imo_class,

                imo_group: req.body.imo_group,

                imo_ems_no: req.body.imo_ems_no,

                company_branch_id: req.body.company_branch_id,

                mbl_id: req.body.mbl_id,

                imo_desc: req.body.imo_desc,

                unitOf: req.body.unitOf,

                transshipment: req.body.transshipment,

                yard_id: req.body.yard_id,

                IECode: req.body.IECode,

                APCode: req.body.APCode,

                concor_id: req.body.concor_id,

                sks_id: req.body.sks_id,

                typeof_bl: req.body.typeof_bl,

                transaction_status: req.body.transaction_status,

                blprint_charge_flag: req.body.blprint_charge_flag,

                bl_gen_auto_num: req.body.bl_gen_auto_num,

                basic_freight_usd: req.body.basic_freight_usd,

                basic_freight_inr: req.body.basic_freight_inr,

                BAF_usd: req.body.BAF_usd,

                BAF_inr: req.body.BAF_inr,

                CAF_usd: req.body.CAF_usd,

                CAF_inr: req.body.CAF_inr,

                Freight_surcharge_usd: req.body.Freight_surcharge_usd,

                Freight_surcharge_inr: req.body.Freight_surcharge_inr,

                Freight_other_usd: req.body.Freight_other_usd,

                Freight_other_inr: req.body.Freight_other_inr,

                total_freight_usd: req.body.total_freight_usd,

                total_freight_inr: req.body.total_freight_inr,

                thc_inr: req.body.thc_inr,

                doc_inr: req.body.doc_inr,

                other_inr: req.body.other_inr,

                DO_inr: req.body.DO_inr,

                DDC_inr: req.body.DDC_inr,

                DDC_USD: req.body.DDC_USD,

                bl_charge_inr: req.body.bl_charge_inr,

                service_tax_inr: req.body.service_tax_inr,

                total_charges_inr: req.body.total_charges_inr,

                exchange_rate: req.body.exchange_rate,

                repo_inr: req.body.repo_inr,

                total_charges_inr_word: req.body.total_charges_inr_word,

                container_nos: req.body.container_nos,

                marks_print: req.body.marks_print,

                container_details_print: req.body.container_details_print,

                container_details_attach_sheet: req.body.container_details_attach_sheet,

                no_of_container_text: req.body.no_of_container_text,

                CHABondNo: req.body.CHABondNo,

                consig_factory_loc: req.body.consig_factory_loc,

                desc_of_goods_print: req.body.desc_of_goods_print,

                container_marks_print: req.body.container_marks_print,

                container_marks_attach_sheet: req.body.container_marks_attach_sheet,

                attachment_remarks: req.body.attachment_remarks,

                clause_description: req.body.clause_description,

                is_deleted: req.body.is_deleted,

                do_no: req.body.do_no,

                do_date: req.body.do_date,

                sector_id: req.body.sector_id,

                last_vessel_id: req.body.last_vessel_id,

                last_vessel_text: req.body.last_vessel_text,

                last_voy_id: req.body.last_voy_id,

                last_voy_text: req.body.last_voy_text,

                free_days_origin: req.body.free_days_origin,

                free_days_dest: req.body.free_days_dest,

                Dem_rate_origin: req.body.Dem_rate_origin,

                Dem_rate_dest: req.body.Dem_rate_dest,

                freeDaysCurrency: req.body.freeDaysCurrency,

                DemCurrency: req.body.DemCurrency,

                booked_through: req.body.booked_through,

                broker_Id: req.body.broker_Id,

                brokerage: req.body.brokerage,

                brokerage_percentage: req.body.brokerage_percentage,

                pol_terminal: req.body.pol_terminal,

                ship_Reference_Date: req.body.ship_Reference_Date,

                commodity_id: req.body.commodity_id,

                marine_pollutant: req.body.marine_pollutant,

                page_type: req.body.page_type,

                deleted_no: req.body.deleted_no,

                M_BL: req.body.M_BL,

                H_BL: req.body.H_BL,

                financial_year_id: req.body.financial_year_id,

                tare_wt: req.body.tare_wt,

                tare_wt_unit: req.body.tare_wt_unit,

                old_id: req.body.old_id,

                customer_bl_id: req.body.customer_bl_id,

                hbl_nos: req.body.hbl_nos,

                mbl_nos: req.body.mbl_nos,

                deleted: req.body.deleted,

                vessArrDate: req.body.vessArrDate,

                freePeriodStrtDate: req.body.freePeriodStrtDate,

                pod_broker_id: req.body.pod_broker_id,

                bl_release_type: req.body.bl_release_type,

                bank: req.body.bank,

                document_type_id: req.body.document_type_id,

                Commodity_type: req.body.Commodity_type,

                HS_code: req.body.HS_code,

                proper_shipping_name: req.body.proper_shipping_name,

                subsidiary_risk: req.body.subsidiary_risk,

                flash_point_unit: req.body.flash_point_unit,

                melting_point: req.body.melting_point,

                melting_point_unit: req.body.melting_point_unit,

                heating_temp: req.body.heating_temp,
                heating_temp_unit: req.body.heating_temp_unit,

                post_carriage: req.body.post_carriage,

                is_coloader_data: req.body.is_coloader_data,

                business_type: req.body.business_type,

                cas_no: req.body.cas_no,

                clause_desc: req.body.clause_desc,

                specific_gravity: req.body.specific_gravity,

                page_code: req.body.page_code,

                voucher_id: req.body.voucher_id,

                marks_container_details: req.body.marks_container_details,

                item_type: req.body.item_type,

                consignee_address1: req.body.consignee_address1,

                consignee_address2: req.body.consignee_address2,

                consignee_address3: req.body.consignee_address3,

                notifying_party1_add1: req.body.notifying_party1_add1,

                notifying_party1_add2: req.body.notifying_party1_add2,

                notifying_party1_add3: req.body.notifying_party1_add3,

                concor_bond_no: req.body.concor_bond_no,

                destination_edi_code: req.body.destination_edi_code,

                concor_desc: req.body.concor_desc,

                mode: req.body.mode,

                commodity_text: req.body.commodity_text,

                new_igm_no: req.body.new_igm_no,

                new_igm_date: req.body.new_igm_date,

                new_line_no: req.body.new_line_no,

                new_hbl_type: req.body.new_hbl_type,

                mlo: req.body.mlo,

                slot_owner: req.body.slot_owner,

                delivery_agent_branch: req.body.delivery_agent_branch,

                delivery_agent_branch_text: req.body.delivery_agent_branch_text,

                pod_agent_address: req.body.pod_agent_address,

                soc: req.body.soc,

                new_consignee_id: req.body.new_consignee_id,

                sez: req.body.sez,

                hss: req.body.hss,

                surveyor_id: req.body.surveyor_id,

                factory_name: req.body.factory_name,

                container_charge_details: req.body.container_charge_details,

                GRent_free_days: req.body.GRent_free_days,

                package_type_text: req.body.package_type_text,

                load_port_agent_add: req.body.load_port_agent_add,

                bl_no: req.body.bl_no,

                igm_remarks: req.body.igm_remarks,

                landing_date: req.body.landing_date,

                created_by_company_branch_id: req.body.created_by_company_branch_id,

                created_by_company_id: req.body.created_by_company_id,

                bl_sl_no: req.body.bl_sl_no,

                shipping_bill_no: req.body.shipping_bill_no,

                chargeable_weight: req.body.chargeable_weight,

                chargeable_weight_unit: req.body.chargeable_weight_unit,

                transhipment_agent: req.body.transhipment_agent,

                transhipment_agent1: req.body.transhipment_agent1,

                Rotation_no: req.body.Rotation_no,

                arrival_date: req.body.arrival_date,

                volume_weight: req.body.volume_weight,

                sub_job_id: req.body.sub_job_id,

                department_id: req.body.department_id,

                bl_type_id: req.body.bl_type_id,

                bl_category_id: req.body.bl_category_id,

                sailing_date: req.body.sailing_date,

                new_item_type: req.body.new_item_type,

                issuing_agent_id: req.body.issuing_agent_id,

                net_of_amt: req.body.net_of_amt,

                brokerage_paid: req.body.brokerage_paid,

                parent_bl_id: req.body.parent_bl_id,

                frt_approval_no: req.body.frt_approval_no,

                pol_agent_branch: req.body.pol_agent_branch,

                pod_agent_branch: req.body.pod_agent_branch,

                convref: req.body.convref,

                containerwise_details_in_bl_print: req.body.containerwise_details_in_bl_print,

                detention_id: req.body.detention_id,

                jumping_slab: req.body.jumping_slab,

                transit_time: req.body.transit_time,

                destination_depot_id: req.body.destination_depot_id,

                destination_depot_address: req.body.destination_depot_address,

                EDoc: req.body.EDoc,

                cheque_no: req.body.cheque_no,

                cheque_date: req.body.cheque_date,

                deposit_amount: req.body.deposit_amount,

                deposit_received_date: req.body.deposit_received_date,

                bond_cancelled_date: req.body.bond_cancelled_date,

                slab_count: req.body.slab_count,

                route_type_id: req.body.route_type_id,

                carrier_instruction: req.body.carrier_instruction,

                dpd_code_id: req.body.dpd_code_id,

                load_port_cha_branch: req.body.load_port_cha_branch,

                surveyor_branch: req.body.surveyor_branch,

                Rot_no: req.body.Rot_no,

                slot_charge_paid_by: req.body.slot_charge_paid_by,

                switch_agent: req.body.switch_agent,

                switch_bl: req.body.switch_bl,

                switch_agent_branch: req.body.switch_agent_branch,

                consignee_nominated_cfs: req.body.consignee_nominated_cfs,

                transhipment_agent_branch: req.body.transhipment_agent_branch,

                transhipment_agent1_branch: req.body.transhipment_agent1_branch,

                plr_agent: req.body.plr_agent,

                plr_agent_branch: req.body.plr_agent_branch,

                wt_bl_print: req.body.wt_bl_print,

                origin_demurrage_free_days: req.body.origin_demurrage_free_days,

                destination_demurrage_free_days: req.body.destination_demurrage_free_days,

                pod_hs_code: req.body.pod_hs_code,

                transhipment_discharge_vessel_id: req.body.transhipment_discharge_vessel_id,

                transhipment_discharge_voyage_id: req.body.transhipment_discharge_voyage_id,

                transhipment_load_vessel_id: req.body.transhipment_load_vessel_id,

                transhipment_load_voyage_id: req.body.transhipment_load_voyage_id,

                third_cfs_id: req.body.third_cfs_id,

                do_valid_date: req.body.do_valid_date,

                bl_updated: req.body.bl_updated,

                include_in_dsr: req.body.include_in_dsr,

                BL_Nom_Status: req.body.BL_Nom_Status,

                tranship_port2: req.body.tranship_port2,

                transhipment_agent2: req.body.transhipment_agent2,

                transhipment_agent2_branch: req.body.transhipment_agent2_branch,

                transhipment2_load_vessel_id: req.body.transhipment2_load_vessel_id,

                transhipment2_load_voyage_id: req.body.transhipment2_load_voyage_id,

                sb_date: req.body.sb_date,

                shipper_id_no: req.body.shipper_id_no,

                consignee_id_no: req.body.consignee_id_no,

                notify_party1_id_no: req.body.notify_party1_id_no,

                surrender_date: req.body.surrender_date,

                trade_terms_id: req.body.trade_terms_id,

                new_consignee_address: req.body.new_consignee_address,

                new_consignee_add: req.body.new_consignee_add,
                email_to: req.body.email_to,
                email_cc: req.body.email_cc,
                payment_coll_agent: req.body.payment_coll_agent,
                export_job_no: req.body.export_job_no,
                import_job_no: req.body.import_job_no,
                print_cbm: req.body.print_cbm,
                tbl_bl_charge: req.body.tbl_bl_charge,
                tbl_bl_clause: req.body.tbl_bl_clause,
                tbl_bl_container: req.body.tbl_bl_container,


            };

            let addtbl = await Collectionname.insertMany([insesrtdata]);


            if (addtbl.length > 0) {
                res.send({
                    api_version: "v1",
                    success: true,
                    message: 'Data added successfully..!',
                    data: []
                });
            } else {
                res.send({
                    api_version: "v1",
                    success: false,
                    message: 'Data Can Not Be Added ..!',
                    data: []
                });
            }


        } catch (error) {
            console.log(error);
            res.send({
                api_version: "v1",
                success: false,
                message: 'Something Went Wrong...',
                data: error
            });

        }
    },
    Dynamic_Add: async (req, res) => {
        try {
            let groupBydata = groupBy(form_controler, "tablename")
            console.log(groupBydata);
            let table_names = Object.keys(groupBydata)
            console.log(table_names);
            let insertdata = []
            table_names.map(async (e) => {
                let data = {}
                groupBydata[e].map((d) => {
                    data[d.fieldname] = d.value || generateRandomString(5)
                })
                console.log(data);
                let temp_insert = await model.AddData(e, e, data, res)
                // insertdata.push(temp_insert)
            })
            // if (insertdata.length>0) {
            res.send({
                success: true,
                message: "Data inserted successfully",
                data: insertdata
            })
            // }

        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went wrong...",
                data: error.message
            })
        }
    },


    // formControll add function..........................
    parentChildAdd: async (req, res) => {
        try {
            // console.log(new_formcontroller);
            let JsonData = new_formcontroller;
            JsonData.map(async (jd) => {
                let insertdata = {}
                console.log(jd.table_name);
                jd.fields.map((f) => {
                    // console.log(f);
                    insertdata[f.fieldname] = f.value || generateRandomString(5)
                })
                jd.childern.map((child) => {
                    insertdata[child.table_name] = []
                    child.fields.map((child_fields) => {
                        child_fields.value.map((values, idx) => {
                            if (!insertdata[child.table_name][idx]) {
                                insertdata[child.table_name][idx] = { id: idx + 1 };
                            }
                            insertdata[child.table_name][idx][child_fields.fieldname] = values;
                        })
                    })
                })
                let result = await model.AddData(jd.table_name, jd.table_name, insertdata, res)
                console.log(insertdata);
                if (result) {
                    res.send({
                        success: true,
                        message: "Data inserted successfully",
                        data: result
                    })
                }
            })



        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went worng",
                data: error.message
            })
        }
    },




    // Code for Form Controler.....................................................................................................
    Formcontrol: async (req, res) => {
        try {
            // Define validation rules for the incoming data
            const validationRule = {
                tableName: "required",
                menuID: "required"
            }
    
            // Validate the request body against the validation rules
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    // If validation fails, return an error response
                    res.status(403).send({
                        success: false,
                        message: "Validation Error....! ",
                        data: err
                    })
                } else {
                    // Prepare the data to be inserted or updated in the FormControl table
                    let insertData = {
                        id: req.body.id || "",
                        tableName: req.body.tableName,
                        menuID: req.body.menuID,
                        fields: req.body.fields,
                        // Set updated date and updated by if id exists and is not empty
                        ...(req.body.id && req.body.id !== "" && {
                            updatedDate: new Date(),
                            updatedby: req.body.updatedby
                        }),
                        // Set created by if id is empty
                        ...(req.body.id && req.body.id === "" && {
                            createdBy: req.body.createdBy
                        })
                    }
    
                    // Ensure that children are an array, if not, set to an empty array
                    insertData.children = Array.isArray(req.body.children) ? req.body.children : []
    
                    // Perform the database operation to update or insert data
                    let data = await model.Update_If_Avilable_Else_Insert("tblFormcontrol", "mainTableSchema", insertData, res)
    
                    // Send response based on the result of the database operation
                    data ? 
                        res.send({ success: true, message: "Data inserted successfully....", data: data }) : 
                        res.status(500).send({ success: false, message: "Data not inserted Successfully..." })
                }
            })
        } catch (error) {
            // Handle any errors during the process and send an error response
            res.status.send({
                success: false,
                message: "Something went wrong",
                data: error
            })
        }
    },
    listControlToDrowScreen: async (req, res) => {
        try {
            // Initialize a match object for MongoDB query
            let _matchData = {}
    
            // Define the initial query structure for MongoDB aggregation
            let query = [
                {
                    $match: _matchData
                }
            ]
    
            // If a menuID is provided in the query, add it to the match criteria
            if (req.query.menuID) {
                _matchData.menuID = req.query.menuID;
            }
    
            // Fetch form control data from the database using the model's AggregateFetchData method
            let formControllerData = await model.AggregateFetchData("tblFormcontrol", "mainTableSchema", query, res);
    
            // Process each form control data and its child elements
            await Promise.all(formControllerData.map(async (data) => {
                await processFields(data.fields, model, res);
                for (let ch of data.children) {
                    await processFields(ch.fields, model, res);
                    for (let subChild of ch.subChildren) {
                        await processFields(subChild.fields, model, res);
                    }
                }
            }));
            // console.log(formControllerData.length);
            // return  res.send({ success: true, message: "Data Found", data: formControllerData })    
            // Send a response with the form control data if found, otherwise send a 'data not found' message
            formControllerData.length > 0 ? 
                res.send({ success: true, message: "Data Found", data: formControllerData }) : 
                res.send({ success: false, message: "Data Not Found", data: [] })
        } catch (error) {
            // Handle any errors during the process and send an error response
            res.send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }
}