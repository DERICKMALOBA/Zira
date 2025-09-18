 const fetchCustomerData = async () => {
    console.log("🔍 Starting to fetch customer data for ID:", customerId);
    setLoading(true);
    try {
      // Fetch customer details
      console.log("📋 Fetching customer details...");
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) {
        console.error("❌ Customer fetch error:", customerError);
        throw customerError;
      }
      console.log("✅ Customer data fetched:", customer);

      // Fetch related data
      console.log("📋 Fetching related data...");
      const [
        { data: guarantor, error: guarantorError },
        { data: nextOfKin, error: nextOfKinError },
        { data: securityItemsData, error: securityError },
        { data: guarantorSecurityData, error: guarantorSecurityError },
        { data: loanData, error: loanError },
        { data: businessImagesData, error: businessImagesError }
      ] = await Promise.all([
        supabase.from("guarantors").select("*").eq("customer_id", customerId).single(),
        supabase.from("next_of_kin").select("*").eq("customer_id", customerId).single(),
        supabase.from("security_items").select("*, security_item_images(image_url)").eq("customer_id", customerId),
        supabase.from("guarantor_security").select("*, guarantor_security_images(image_url)").eq("customer_id", customerId),
        supabase.from("loans").select("*").eq("customer_id", customerId).single(),
        supabase.from("business_images").select("*").eq("customer_id", customerId)
      ]);

      // Log each data fetch result
      console.log("👤 Guarantor data:", guarantor, guarantorError ? "Error:" + guarantorError.message : "✅");
      console.log("👨‍👩‍👧‍👦 Next of Kin data:", nextOfKin, nextOfKinError ? "Error:" + nextOfKinError.message : "✅");
      console.log("🔒 Security items data:", securityItemsData, securityError ? "Error:" + securityError.message : "✅");
      console.log("🔐 Guarantor security data:", guarantorSecurityData, guarantorSecurityError ? "Error:" + guarantorSecurityError.message : "✅");
      console.log("💰 Loan data:", loanData, loanError ? "Error:" + loanError.message : "✅");
      console.log("🏢 Business images data:", businessImagesData, businessImagesError ? "Error:" + businessImagesError.message : "✅");

      // Set form data
      console.log("📝 Setting form data...");
      const updatedFormData = {
        prefix: customer?.prefix || "",
        Firstname: customer?.Firstname || "",
        Middlename: customer?.Middlename || "",
        Surname: customer?.Surname || "",
        maritalStatus: customer?.marital_status || "",
        residenceStatus: customer?.residence_status || "",
        mobile: customer?.mobile || "",
        alternativeMobile: customer?.alternative_mobile || "",
        occupation: customer?.occupation || "",
        dateOfBirth: customer?.date_of_birth || "",
        gender: customer?.gender || "",
        idNumber: customer?.id_number || "",
        postalAddress: customer?.postal_address || "",
        code: customer?.code || "",
        town: customer?.town || "",
        county: customer?.county || "",
        businessName: customer?.business_name || "",
        businessType: customer?.business_type || "",
        yearEstablished: customer?.year_established || "",
        businessLocation: customer?.business_location || "",
        daily_Sales: customer?.daily_Sales || "",
        road: customer?.road || "",
        landmark: customer?.landmark || "",
        hasLocalAuthorityLicense: customer?.has_local_authority_license ? "Yes" : "No",
        
        guarantor: guarantor ? {
          prefix: guarantor.prefix || "",
          Firstname: guarantor.Firstname || "",
          Surname: guarantor.Surname || "",
          idNumber: guarantor.id_number || "",
          maritalStatus: guarantor.marital_status || "",
          Middlename: guarantor.Middlename || "",
          dateOfBirth: guarantor.date_of_birth || "",
          residenceStatus: guarantor.residence_status || "",
          gender: guarantor.gender || "",
          mobile: guarantor.mobile || "",
          postalAddress: guarantor.postal_address || "",
          code: guarantor.code || "",
          occupation: guarantor.occupation || "",
          relationship: guarantor.relationship || "",
          county: guarantor.county || "",
          cityTown: guarantor.city_town || "",
        } : {
          prefix: "",
          Firstname: "",
          Surname: "",
          idNumber: "",
          maritalStatus: "",
          Middlename: "",
          dateOfBirth: "",
          residenceStatus: "",
          gender: "",
          mobile: "",
          postalAddress: "",
          code: "",
          occupation: "",
          relationship: "",
          county: "",
          cityTown: "",
        },
        
        nextOfKin: nextOfKin ? {
          Firstname: nextOfKin.Firstname || "",
          Surname: nextOfKin.Surname || "",
          Middlename: nextOfKin.Middlename || "",
          idNumber: nextOfKin.id_number || "",
          relationship: nextOfKin.relationship || "",
          mobile: nextOfKin.mobile || "",
          alternativeNumber: nextOfKin.alternative_number || "",
          employmentStatus: nextOfKin.employment_status || "",
          county: nextOfKin.county || "",
          cityTown: nextOfKin.city_town || "",
        } : {
          Firstname: "",
          Surname: "",
          Middlename: "",
          idNumber: "",
          relationship: "",
          mobile: "",
          alternativeNumber: "",
          employmentStatus: "",
          county: "",
          cityTown: "",
        },
        
        loan: loanData ? { prequalifiedAmount: loanData.prequalified_amount || "" } : { prequalifiedAmount: "" }
      };

      setFormData(updatedFormData);
      console.log("✅ Form data set:", updatedFormData);

      // Set security items
      if (securityItemsData && securityItemsData.length > 0) {
        console.log("🔒 Processing security items...");
        const processedSecurityItems = securityItemsData.map(item => ({
          id: item.id,
          item: item.item || "",
          description: item.description || "",
          identification: item.identification || "",
          value: item.value || ""
        }));
        
        setSecurityItems(processedSecurityItems);
        console.log("✅ Security items processed:", processedSecurityItems);
        
        // Process security item images
        const securityImages = securityItemsData.map(item => 
          item.security_item_images ? item.security_item_images.map(img => img.image_url) : []
        );
        setSecurityItemImages(securityImages);
        console.log("🖼️ Security item images:", securityImages);
      } else {
        console.log("ℹ️ No security items found");
        setSecurityItems([]);
        setSecurityItemImages([]);
      }

      // Set guarantor security items
      if (guarantorSecurityData && guarantorSecurityData.length > 0) {
        console.log("🔐 Processing guarantor security items...");
        const processedGuarantorSecurity = guarantorSecurityData.map(item => ({
          id: item.id,
          item: item.item || "",
          description: item.description || "",
          identification: item.identification || "",
          value: item.estimated_market_value || ""
        }));
        
        setGuarantorSecurityItems(processedGuarantorSecurity);
        console.log("✅ Guarantor security items processed:", processedGuarantorSecurity);
        
        // Process guarantor security images
        const guarantorSecurityImages = guarantorSecurityData.map(item => 
          item.guarantor_security_images ? item.guarantor_security_images.map(img => img.image_url) : []
        );
        setGuarantorSecurityImages(guarantorSecurityImages);
        console.log("🖼️ Guarantor security images:", guarantorSecurityImages);
      } else {
        console.log("ℹ️ No guarantor security items found");
        setGuarantorSecurityItems([]);
        setGuarantorSecurityImages([]);
      }

      // Set existing images
      const imageData = {
        passport: customer?.passport_url || null,
        idFront: customer?.id_front_url || null,
        idBack: customer?.id_back_url || null,
        house: customer?.house_image_url || null,
        business: businessImagesData ? businessImagesData.map(img => img.image_url) : [],
        security: securityItemsData ? securityItemsData.flatMap(item => 
          item.security_item_images ? item.security_item_images.map(img => img.image_url) : []
        ) : [],
        guarantorPassport: guarantor?.passport_url || null,
        guarantorIdFront: guarantor?.id_front_url || null,
        guarantorIdBack: guarantor?.id_back_url || null,
        guarantorSecurity: guarantorSecurityData ? guarantorSecurityData.flatMap(item => 
          item.guarantor_security_images ? item.guarantor_security_images.map(img => img.image_url) : []
        ) : []
      };

      setExistingImages(imageData);
      console.log("🖼️ Existing images set:", imageData);

      // Clear any previous errors
      setErrors({});
      console.log("✅ Customer data fetch completed successfully");

    } catch (error) {
      console.error("❌ Error fetching customer data:", error);
      toast.error("Failed to load customer data: " + error.message);
      setErrors({ fetch: error.message });
    } finally {
      setLoading(false);
      console.log("🏁 Fetch customer data process completed");
    }
  };